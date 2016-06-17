/* jshint devel: true */

'use strict';
function MapModel() {
  console.log('mapModel');
  var _this = this;

  this.data = {};
  this.tempData = [];
  this.feedsList = {};


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
    })
    .catch(function(error) {
      console.error('Failed!', error);
    });
  };

} //mapModel

MapModel.prototype = {
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

  console.log('target geoJSON, after chnages');
  console.log(JSON.stringify(geoJSON));

    
}
};

var model = new MapModel();
model.init('bcycle_indego','https://gbfs.bcycle.com/bcycle_indego/gbfs.json');
