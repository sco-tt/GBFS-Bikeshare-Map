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
  this.tiles = L.tileLayer(
    'http://a.tiles.mapbox.com/v3/lyzidiamond.map-ietb6srb/{z}/{x}/{y}.png', {
      maxZoom: 19
    }); 
  this.url = 'https://www.rideindego.com/stations/json/';
  this.itemAdded = new Event(this);


  this.sendRequest = function(url) {
    console.log('model.sendRequest');
    _this.request = this.CORSRequest('GET', url);

    if (!this.request) {
      throw new Error('CORS not supported');
    }
    this.request.send();

    this.request.onload = function() {
      _this.data = JSON.parse(this.responseText);
      _this.itemAdded.notify({ data : _this.data });
    };
    this.request.onerror = function() {
      throw new Error('There was an error!');
    };
  };
} //mapModel

MapModel.prototype = {
  // Draw the Map of Philadelphia
  renderMap: function() {
    var mapTiles = this.tiles;
    this.map = L.map('indego-stations', {
      center: [39.95, -75.15],
      zoom: 13
    });
    mapTiles.addTo(this.map);
  },

  CORSRequest: function (method, url) {
    var xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) {
      // Check if the XMLHttpRequest object has a "withCredentials" property.
      // "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest !== 'undefined') {
      // Otherwise, check if XDomainRequest.
      // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      // Otherwise, CORS is not supported by the browser.
      xhr = null;
    }
    return xhr;
  }

};

function MapView(model) {
  console.log('MapView');
  this._model = model;
  var _this = this;

  this._model.itemAdded.attach(function () {
    _this.drawPoints();
    _this.writeTime();
    _this.listStations();
  });
}

MapView.prototype = {
  init: function() {
    this._model.renderMap();
    this._model.sendRequest(this._model.url);
  },

  drawPoints: function() {
    var geojson = L.geoJson(this._model.data, {
      onEachFeature: function (feature, layer) {
        //console.log(feature.properties);
        var popup = L.popup()
          .setContent(
            '<p>' + feature.properties.name + '<br>' + 
            'Bikes Available: ' + feature.properties.bikesAvailable + '</br>' + 
            'Docks Availabe: ' + feature.properties.docksAvailable + 
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
      var obj = {name: name};
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