/* jshint devel: true */

'use strict';
function MapModel() {
  console.log('mapModel');
  var _this = this;

  this.data = {};
  this.feedsList = {};

  this.init = function(systemName, url) {
    this.getJSON(url).then(function(response) {
     _this.getStationFeeds(systemName, response);
    }).then(function() {
      _this.getStationData(systemName, _this.feedsList);
    }).catch(function(error) {
      console.error('Failed!', error);
    });
  };

  this.getStationData = function(systemName, feedsList) {
    var sequence = Promise.resolve();
    // Loop through our chapter urls
    feedsList.forEach(function(url){
       sequence = sequence.then(function() {
        console.log(url);
        return _this.getJSON(url);
      }).then(function(feed) {
        console.log(feed);
      });
    }, Promise.resolve());
        // Add these actions to the end of the sequence
    //     sequence = sequence.then(function(url) {
    //       console.log(url);
    //       return this.getJSON(url);
    //     }).then(function(feed) {
    //       console.log(feed);
    //     });
    // });
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
  
  getStationFeeds: function(systemName, feedsListObj) {
    var stationFeeds = [];
    var feeds = feedsListObj.data.en.feeds;
    for (var i = 0; i < feeds.length; ++i) {
      if (feeds[i]['name'] === 'station_status') {
        stationFeeds.push(feeds[i]['url']);
      } else if (feeds[i]['name'] === 'station_information') {
        stationFeeds.push(feeds[i]['url']);
      }
    }
    this.feedsList = stationFeeds;
  }, 

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
