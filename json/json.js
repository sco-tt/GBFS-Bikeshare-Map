/* jshint devel: true */
/*global  stationInformation, stationStatus, srcGeoJSON */
(function() {
'use strict';


function combine () {
  
  var geoJSON = {
    'features' : [], 
    'type' : 'featureCollection'
  };

  console.log('srcGeoJSON:');
  console.log(srcGeoJSON);
  console.log('target geoJSON, before changes');
  console.log(geoJSON);

  stationInformation = stationInformation.data.stations;
  stationStatus = stationStatus.data.stations;
  console.log(stationStatus);
  //stationStatus = station_status.data

  
  for (var i = 0; i < stationInformation.length; ++i) {
    var geoObj = {
      'geometry' : {
        'coordinates' : [stationInformation[i].lat, stationInformation[i].lon],
        'type' : 'Point'
      }, 
      'properties' : {
        'name' : stationInformation[i].name,
        'addressStreet' : stationInformation[i].address,
        'station_id' : stationInformation[i].station_id

      },
      'type' : 'feature'
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
    //geoJSON.features.geometry.coordinates.push([1,2]);
  }
  console.log('target geoJSON, after chnages');
  console.log(geoJSON);
}


combine();

})();