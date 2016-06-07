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
    var geoJSON = {};
    geoJSON['features'] = {};
    console.log(geoJSON);
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
      console.log(stationInformation[i]);
         geoJSON.features[i].geometry.coordinates.push([stationInformation[i].data.stations.lat,]);

    }

    
  }

  // getStationData: function(systemName, feedsList) {
  //   console.log('this is getStationData');
  //   console.log(feedsList);
  //   var feedsList = feedsList[systemName];
  //   console.log(feedsList);
  //     for (var feed in feedsList ) {
  //       this.data[systemName] = this.getJSON(feedsList[feed]);
  //     }
  
  // }

};

var model = new MapModel();
model.init('bcycle_indego','https://gbfs.bcycle.com/bcycle_indego/gbfs.json');
