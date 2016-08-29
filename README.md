GBFS Bike Share Map
===================
#About

This is a data visualization project exploring the [General Bikeshare Feed Specification](https://github.com/NABSA/gbfs), a standardized data feed for bike share system availability developed by the [North American Bike Share Association](http://nabsa.net/). More details are available [here](https://github.com/NABSA/gbfs/blob/master/README.md).

This project uses the publicly-available [list of bike share systems](https://github.com/NABSA/gbfs/blob/master/systems.csv) to programmatically gather real time bike share station information from individual system APIs. 

The [main application](https://github.com/sco-tt/GBFS-Bikeshare-Map/blob/master/src/js/app.js) parses this data and displays stations on a map and in a table using Leaflet.js and Handlebars.

## Installation

The project can be run locally using Browsersync. You'll need Node and npm installed.

    git clone git@github.com:sco-tt/GBFS-Bikeshare-Map.git && cd GBFS-Bikeshare-Map
    npm install
    gulp js
    gulp serve


## Technologies

 - Leaflet.js
 - MapBox
 - Handlebars
 - Papaparse
 - Zurb Foundation
 - Gulp