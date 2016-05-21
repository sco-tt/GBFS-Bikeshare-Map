function mapModel() {
  console.log('mapModel');
  var _this = this;
      console.log(_this);
  this.tiles = L.tileLayer('http://a.tiles.mapbox.com/v3/lyzidiamond.map-ietb6srb/{z}/{x}/{y}.png', {
    maxZoom: 19
  }); 
  _this.url = 'https://www.rideindego.com/stations/json/';
  _this.itemAdded = new Event(this);


  _this.sendRequest = function(url) {
    console.log('model.sendRequest');
    _this.request = this.CORSRequest('GET', url);
    if (!this.request) {
      throw new Error('CORS not supported');
    }
    _this.request.send();

    _this.request.onload = function() {
    var responseText = this.responseText;
    _this.data = JSON.parse(responseText);
    //console.log(_this.itemAdded.notify);

    _this.itemAdded.notify({ data : _this.data });

    // var geojson = L.geoJson(json, {
    //   onEachFeature: function (feature, layer) {
    //     layer.bindPopup(feature.properties.name);
    //   }
    // });
    // var map = L.map('indego-stations').fitBounds(geojson.getBounds());
    // mapTiles.addTo(map);
    // geojson.addTo(map);
    }
    this.request.onerror = function() {
      console.log('There was an error!');
    };
  }


} //mapModel

mapModel.prototype = {
  renderMap: function() {
    //var map = L.map('indego-stations').fitBounds(geojson.getBounds());
    var mapTiles = this.tiles;
    this.map = L.map('indego-stations', {
      center: [39.95, -75.15],
      zoom: 13
    });
    mapTiles.addTo(this.map)
  },

  buildTiles: function(json) {
    var geojson = L.geoJson(json, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.name);
      }
    });
  },

  CORSRequest: function (method, url) {
    var xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) {
      // Check if the XMLHttpRequest object has a "withCredentials" property.
      // "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // Otherwise, check if XDomainRequest.
      // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      // Otherwise, CORS is not supported by the browser.
      xhr = null;
    }
    return xhr;
  },

  requestListeners: function() {

    this.request.onload = function() {
    var responseText = xhr.responseText;
    var json = JSON.parse(responseText);
    console.log('request received');
    }
    this.request.onerror = function() {
      console.log('There was an error!');
    };
  }
}


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


function mapView(model) {
  console.log('mapView');
  this._model = model;
  var _this = this;

    this._model.itemAdded.attach(function () {
      _this.drawPoints();
  });
}

mapView.prototype = {
  init: function() {
    this._model.renderMap();
    this._model.sendRequest(this._model.url)
  },

  drawPoints: function() {
        var geojson = L.geoJson(this._model.data, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.name);
      }
    });
console.log(this._model);
    geojson.addTo(this._model.map);
  }
}


function mapController (model, view) {
  console.log('mapController');
  console.log(model.tiles);
  this._model = model;
  this._view = view;
  var _this = this;







  // xhr.onload = function() {
  //   var responseText = xhr.responseText;
  //   var json = JSON.parse(responseText);
  //   var geojson = L.geoJson(json, {
  //     onEachFeature: function (feature, layer) {
  //       layer.bindPopup(feature.properties.name);
  //     }
  //   });
  //   var map = L.map('indego-stations').fitBounds(geojson.getBounds());
  //   mapTiles.addTo(map);
  //   geojson.addTo(map);

  // }
  // xhr.onerror = function() {
  //   console.log('There was an error!');
  // };
}

(function(){
  var model = new mapModel();
  var view = new mapView(model);
  var controller = new mapController(model, view);
  // Show the Map
  view.init();

})();