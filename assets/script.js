/* jshint devel: true */
/* globals L, Handlebars, Papa */

'use strict';

/**
 * Events
 */


 function Event(sender) {
  this._sender = sender;
  this._listeners = [];
}

Event.prototype = {
  attach : function (listener) {
    this._listeners.push(listener);
  },
  notify : function (args) {
    var index;
    for (index = 0; index < this._listeners.length; index += 1) {
      this._listeners[index](this._sender, args);
    }
  }
};

/**
 * Model 
 */

function MapModel() {
  var _this = this;

  this.data = {};
  this.tempData = [];
  this.feedsList = {};
  this.tiles = L.tileLayer(
    'http://a.tiles.mapbox.com/v3/lyzidiamond.map-ietb6srb/{z}/{x}/{y}.png', {
      maxZoom: 19
    }); 
  this.dataSet = new Event(this);
  this.systemSet = new Event(this);
  this.activeSystem = null;
  this.systemsCSV = 'https://raw.githubusercontent.com/NABSA/gbfs/master/systems.csv';

  this.first = function(url) {
    this.ajax(url).then(function(response) {
      var csvData = Papa.parse(response);
      csvData = csvData.data;
      _this.data.systemsObj = [];
      for (var i = 1; i < csvData.length; ++i) {
        var subObj = {};
        for (var j = 0; j < csvData[i].length; ++j) {
          subObj[csvData[0][j]] = csvData[i][j];
        }
        _this.data.systemsObj.push(subObj);
      }
      console.log(_this.data.systemsObj);
      _this.systemSet.notify({ data : _this.data.systemsObj });
    });
  };

  this.init = function(systemName, url) {
    _this.data[systemName] = {};
    _this.getData(systemName, url);
    _this.activeSystem = systemName;
  };

  this.getData = function(systemName, url) {
    _this.ajax(url, 'json').then(function(response) {
      // To DO: Move station feeds to model
      _this.getStationFeeds(systemName, response, ['station_information', 'station_status']);
      return Promise.all(
        _this.feedsList.map(function(obj) {
          return _this.ajax(obj.url, 'json');
      })
     ); 
    }).then(function(data) {
      data.forEach(function(respObj) {
        _this.tempData.push(respObj);
      });
    }).then(function() {
      _this.mergeData(_this.tempData, systemName);
      _this.dataSet.notify({ data : _this.data[systemName] });
    })
    .catch(function(error) {
      console.error('Failed!', error);
    });
  };

} //mapModel

MapModel.prototype = {
  
  renderMap: function() {
    var mapTiles = this.tiles;
    this.map = L.map('js-stations-map', {
      center: [39.95, 0],
      zoom: 4
    });
    mapTiles.addTo(this.map);
  },

  sendRequest: function(url) {
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      // Cross Browser checks
      // http://www.telerik.com/blogs/using-cors-with-all-modern-browsers
      if ('withCredentials' in req) {
          req.open('GET', url, true);
      } else if (typeof XDomainRequest !== 'undefined') {
          req = new XDomainRequest();
          req.open('GET', url);
      } else {
          reject(Error('CORS Not Supported in this browser'));
      }
      
      req.onload = function() {
        if (req.status === 200) {
          resolve(req.response);
        }
        else {
          reject(Error(req.statusText));
        }
      };

      // Handle network errors
      req.onerror = function() {
        reject(Error('Network Error'));
      };

      // Make the request
      req.send();
    });
  },

  ajax: function(url, isJSON) {
    return (isJSON) ? this.sendRequest(url).then(JSON.parse) : this.sendRequest(url);
  },

  getStationFeeds: function(systemName, feedsListObj, feedsToExtract) {
    var feeds = feedsListObj.data.en.feeds;
    var stationFeeds = [];
    for (var i = 0; i < feeds.length; ++i) {
      for (var j = 0; j < feedsToExtract.length; j++) {
        if (feeds[i].name.indexOf(feedsToExtract[j]) > -1) {
          stationFeeds.push(feeds[i]);
        }  
      }
    }
    this.feedsList = stationFeeds;
  }, 

  mergeData: function(tempData, systemName) {
    var geoJSON = {
      'features' : [], 
      'type' : 'FeatureCollection'
    };
    
    var stationInformation;
    var stationStatus;

    if (tempData[0].data.stations[0].lat) {
      stationInformation = tempData[0].data.stations;
      stationStatus = tempData[1].data.stations;
    } else if (tempData[1].data.stations[0].lat ){
      stationInformation = tempData[1].data.stations;
      stationStatus = tempData[0].data.stations;
    }

    for (var i = 0; i < stationInformation.length; ++i) {
      /** 
       * Delete stations with lat/long of 0
       * This applies to Boulder 'Purgatory Station'
      */
      if (stationInformation[i].lon === 0 && stationInformation[i].lat === 0) {
        delete stationInformation[i];
        continue;
      }
      var geoObj = {
        'geometry' : {
          'coordinates' : [stationInformation[i].lon, stationInformation[i].lat],
          'type' : 'Point'
        }, 
        'properties' : {
          'name' : stationInformation[i].name,
          'addressStreet' : stationInformation[i].address,
          'station_id' : stationInformation[i].station_id

        },
        'type' : 'Feature'
      };
      
      for (var j = 0; j < stationStatus.length; ++j) {
        if (stationStatus[j].station_id === geoObj.properties.station_id) {
          geoObj.properties.last_reported = stationStatus[j].last_reported;
          geoObj.properties.num_bikes_available = stationStatus[j].num_bikes_available;
          geoObj.properties.num_docks_available = stationStatus[j].num_docks_available;
          break;
        }
      }
      geoJSON.features.push(geoObj); 
    }
    this.data[systemName] = geoJSON;
  }
};


/**
 * View 
 */

function MapView(model) {
  this._model = model;
  var _this = this;

  this._model.dataSet.attach(function () {
    _this.drawPoints();
    // _this.writeTime();
    // _this.listStations();
  });

  this._model.systemSet.attach(function() {
   _this.listSystems();
  });
}

MapView.prototype = {
  init: function() {
    this._model.renderMap();
    // this._model.sendRequest(this._model.url);
    //this._model.init('bcycle_indego','https://gbfs.bcycle.com/bcycle_indego/gbfs.json');
    this._model.init('pronto','https://gbfs.prontocycleshare.com/gbfs/gbfs.json');
    //this._model.init('bcycle_boulder','https://gbfs.bcycle.com/bcycle_boulder/gbfs.json');
    //this._model.init('monash_bike_share', 'https://monashbikeshare.com/opendata/gbfs.json');

    this._model.first(this._model.systemsCSV);

  },

  drawPoints: function() {
    var geojson = L.geoJson(this._model.data[this._model.activeSystem], {
      onEachFeature: function (feature, layer) {
        var popup = L.popup()
          .setContent(
            '<p>' + feature.properties.name + '<br>' + 
            'Bikes Available: ' + feature.properties.num_bikes_available + '</br>' + 
            'Docks Availabe: ' + feature.properties.num_docks_available + 
            '</p>'

            );
        layer.bindPopup(popup);
      }
    });
    geojson.addTo(this._model.map);
    this._model.map.fitBounds(geojson.getBounds());
  }, 
  writeTime: function() {
    var time = new Date();
    var ts = document.getElementById('js-timestamp');
    ts.innerHTML = 'Last Updated at ' + time;
  },

  listSystems: function() {
    var templateScript = document.getElementById('systems-template').innerHTML;
    var theTemplate = Handlebars.compile(templateScript); 
    var systemsList = document.getElementById('js-systems-list');
    systemsList.innerHTML = theTemplate(this._model.data.systemsObj);
  },

  listStations: function() {
    
    var stationData = []; 

    var stations = this._model.data.features;
    for (var i = 0; i < stations.length; i++) {
      var name = stations[i].properties.name;
      var address = stations[i].properties.addressStreet;
      var docksAvailable = stations[i].properties.docksAvailable;
      var bikesAvailable = stations[i].properties.bikesAvailable;
      var obj = { 
                  name: name, 
                  bikesAvailable: bikesAvailable, 
                  docksAvailable: docksAvailable, 
                  address: address
                };
      stationData.push(obj);
    }
    console.log(stationData);

    var templateScript = document.getElementById('station-template').innerHTML;
    var theTemplate = Handlebars.compile(templateScript); 
    var stationList = document.getElementById('js-stations-list');
    stationList.innerHTML = theTemplate(stationData);
  }
};


function MapController (model, view) {
  this._model = model;
  this._view = view;
  var _this = this;
}


(function(){
  var model = new MapModel();
  var view = new MapView(model);
  var controller = new MapController(model, view);
  // Show the Map
  view.init();

})();
