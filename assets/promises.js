/* jshint devel: true */

'use strict';
function MapModel() {
  console.log('mapModel');
  var _this = this;

  this.data = {};
  this.tempdata = [];
  this.feedsList = {};

  this.init = function(systemName, url) {
    this.getJSON(url).then(function(response) {
      console.log('station feeds');
      _this.getStationFeeds(systemName, response, ['station_information', 'station_status']);
    }).then(function() {
      console.log('station data');
      //_this.getStationData(systemName, _this.feedsList);
      return Promise.all(
       _this.feedsList.map(function(obj) {
        _this.getJSON(obj.url);
      })
       );

    }).then(function(data) {
      console.log(data);
    })
    .catch(function(error) {
      console.error('Failed!', error);
    });
  };

  this.getStationData = function(systemName, feedsList) {
    console.log(feedsList);

    // console.log('getStationData call');
    // var sequence = Promise.resolve();
    // feedsList.forEach(function(obj){
    //   var url = obj.url;
    //    sequence = sequence.then(function() {
    //     return _this.getJSON(url);
    //   }).then(function(feed) {
    //     _this.tempdata.push(feed);
    //   });
    // });


    // feedsList.reduce(function(obj){
    //   var url = obj.url;
    //    return sequence.then(function() {
    //     return _this.getJSON(url);
    //   }).then(function(feed) {
    //     _this.tempdata.push(feed);
    //   });
    // }, Promise.resolve());

    return Promise.all(
     feedsList.map(function(obj) {
      _this.getJSON(obj.url);
    })
     );


  };

  this.combineData = function(tempData) {
    console.log(_this.tempdata);
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
          stationFeeds.push(feeds[i])
        }  
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
