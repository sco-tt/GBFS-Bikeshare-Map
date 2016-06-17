/* jshint devel: true */
/* globals L */

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
  console.log('mapModel');
  var _this = this;

  this.data = {};
  this.tempData = [];
  this.feedsList = {};
  this.tiles = L.tileLayer(
    'http://a.tiles.mapbox.com/v3/lyzidiamond.map-ietb6srb/{z}/{x}/{y}.png', {
      maxZoom: 19
    }); 
  this.dataSet = new Event(this);


  this.init = function(systemName, url) {
    _this.data[systemName] = {};
    _this.getData(systemName, url);
  };

  this.getData = function(systemName, url) {
    _this.getJSON(url).then(function(response) {
      _this.getStationFeeds(systemName, response, ['station_information', 'station_status']);
      return Promise.all(
        _this.feedsList.map(function(obj) {
          return _this.getJSON(obj.url);
      })
     ); 
    }).then(function(data) {
      data.forEach(function(respObj) {
        _this.tempData.push(respObj);
      });
    }).then(function() {
      _this.mergeData(_this.tempData);
      _this.dataSet.notify({ data : _this.data });
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
      center: [39.95, -75.15],
      zoom: 13
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

  getJSON: function(url) {
    return this.sendRequest(url).then(JSON.parse);
  },
  
  getStationFeeds: function(systemName, feedsListObj, feedsToExtract) {
    console.log('getStationFeeds prototype');
    var feeds = feedsListObj.data.en.feeds;
    var stationFeeds = [];
    for (var i = 0; i < feeds.length; ++i) {
      for (var j = 0; j < feedsToExtract.length; j++) {
        if (feeds[i]['name'].indexOf(feedsToExtract[j]) > -1) {
          stationFeeds.push(feeds[i]);
        }  
      }
    }
    this.feedsList = stationFeeds;
  }, 

  mergeData: function(tempData) {
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
    //localGeoObj.geometry.coordinates = [1,2];

    geoJSON.features.push(geoObj); 

  }

  this.data = geoJSON;

  console.log('target geoJSON, after chnages');
  console.log(geoJSON);

    
}
};

/**
 * View 
 */

function MapView(model) {
  console.log('MapView');
  this._model = model;
  var _this = this;

  this._model.dataSet.attach(function () {
    _this.drawPoints();
    // _this.writeTime();
    // _this.listStations();
  });
}

MapView.prototype = {
  init: function() {
    this._model.renderMap();
    // this._model.sendRequest(this._model.url);
    this._model.init('bcycle_indego','https://gbfs.bcycle.com/bcycle_indego/gbfs.json');
  },

  drawPoints: function() {
    var geojson = L.geoJson(this._model.data, {
      onEachFeature: function (feature, layer) {
        console.log(feature.properties);
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
  }, 
  writeTime: function() {
    var time = new Date();
    var ts = document.getElementById('js-timestamp');
    ts.innerHTML = 'Last Updated at ' + time;
  },

  listStations: function() {
    
    var stationData = []; 

    var stations = this._model.data.features;
    for (var i = 0; i < stations.length; i++) {
      var name = stations[i].properties.name;
      var address = stations[i].properties.addressStreet;
      var docksAvailable = stations[i].properties.docksAvailable;
      var bikesAvailable = stations[i].properties.bikesAvailable;
      var obj = {name: name, bikesAvailable: bikesAvailable, docksAvailable: docksAvailable};
      stationData.push(obj);
    }
    console.log(stationData);

    var templateScript = document.getElementById('station-template').innerHTML;
    var theTemplate = Handlebars.compile(templateScript); 
    var stationList = document.getElementById('js-stations-list');
    console.log(theTemplate(stationData));
    stationList.innerHTML = theTemplate(stationData);
  }
};


function MapController (model, view) {
  console.log('mapController');
  console.log(model.tiles);
  this._model = model;
  this._view = view;
  var _this = this;

}


(function(){
  var model = new MapModel();
  var view = new MapView(model);
  new MapController(model, view);
  // Show the Map
  view.init();

})();
