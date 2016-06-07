/* jshint devel: true */
/*global  stationInformation, stationStatus, srcGeoJSON */


function combine () {
  'use strict';
  
  var geoJSON = {
    'features' : [], 
    'type' : 'featureCollection'
  };

  console.log('srcGeoJSON:');
  console.log(srcGeoJSON);
  console.log('target geoJSON, before changes');
  console.log(geoJSON);

  stationInformation = stationInformation.data.stations;


  
  for (var i = 0; i < stationInformation.length; ++i) {
    console.log(stationInformation[i]);
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
    //localGeoObj.geometry.coordinates = [1,2];

    geoJSON.features.push(geoObj); 
    //geoJSON.features.geometry.coordinates.push([1,2]);
  }
  console.log('target geoJSON, after chnages');
  console.log(geoJSON);
}

combine();