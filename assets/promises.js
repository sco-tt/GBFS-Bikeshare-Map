'use strict';
function MapModel() {
  console.log('mapModel');
  var _this = this;

  this.url = 'https://www.rideindego.com/stations/json/';
  this.data = {};
  this.feedsList = {};

  this.init = function(systemName, url) {
    this.sendRequest(url).then(function(response) {
     console.log('Success!', response);
     _this.getStationFeeds(systemName, JSON.parse(response));
    }).then(function() {
      console.log('next func');
    }).catch(function(error) {
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
  
  getStationFeeds: function(systemName, feeds) {
    //var feeds = this.data[systemName].data.en.feeds;
    var stationFeeds = {};
    for (var i = 0; i < feeds.length; ++i) {
      if (feeds[i]['name'] === 'station_status') {
        stationFeeds['station_status'] = [feeds[i]['name'], feeds[i]['url']];
      } else if (feeds[i]['name'] === 'station_information') {
        stationFeeds['station_information'] = [feeds[i]['name'], feeds[i]['url']];
      }
    }
    this.feedsList[systemName] = stationFeeds;
  }, 

  getStationData: function() {
    console.log('this is getStationData');
    console.log(this.feedsList);
  }

};

var model = new MapModel();
model.init('bcycle_indego','https://gbfs.bcycle.com/bcycle_indego/gbfs.json');
