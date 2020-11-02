# GeoFiddle [![Build Status](https://travis-ci.org/ruipinge/geofiddle.svg?branch=master)](https://travis-ci.org/ruipinge/geofiddle) [![Coverage Status](https://coveralls.io/repos/github/ruipinge/geofiddle/badge.svg?branch=master)](https://coveralls.io/github/ruipinge/geofiddle?branch=master)

Plot, share, and convert geometries using different formats and projections. Try it [here](https://geofiddle.com).

Some of the most notable features:

- Format and Projection auto-detection
- Direct links for easy sharing of geometries and conversions
- Area and distance measurements (under development!)
- Command line utility (node.js) for scripting and batch processing (under development!)

Supported formats:

- [GeoJSON](http://geojson.org/)
- [Well-Known text](https://en.wikipedia.org/wiki/Well-known_text) (WKT)
- [Extended Well-Known text](https://postgis.net/docs/using_postgis_dbmanagement.html#EWKB_EWKT) (EWKT)
- [Polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
- [Delimiter-separated values](https://en.wikipedia.org/wiki/Delimiter-separated_values) (DSV)

Supported projections:

- [World Geodetic System 1984](https://en.wikipedia.org/wiki/World_Geodetic_System) (WGS84)
  - Unit: degree
  - Axes: latitude, longitude
  - [EPSG:4326](https://epsg.io/4326)
- [British National Grid](https://en.wikipedia.org/wiki/Ordnance_Survey_National_Grid) (BNG) aka Ordnance Survey National Grid
  - Unit: metre
  - Axes: easting, northing
  - [EPSG:27700](https://epsg.io/27700)


## Demo and Examples

Try writting some of the following geometries [here](https://geofiddle.com):

```
{
    "coordinates": [
        531473,
        181763
    ],
    "type": "Point"
}
```

```
POINT(-9.129814 38.736847)
```

```
-0.1068354 51.5114059
```

```
200300 200200 200300 200300 200400 200300 200300 200200
```


## Dependencies and Inspiration

- [Wicket](https://github.com/arthur-e/Wicket) for WKT and GeoJSON parsing and formatting
- [Mapbox Polyline](https://github.com/mapbox/polyline) for Polyline encoding and decoding
- [Geodesy](https://github.com/chrisveness/geodesy) for projection conversions
- [Webpack](https://webpack.js.org/), [Backbone](http://backbonejs.org/), [jQuery](https://jquery.com/), [Lodash](https://lodash.com/), [Jest](https://jestjs.io/)
- [HTML5 Boilerplate](https://html5boilerplate.com/), [Material Components](https://github.com/material-components/material-components-web)
- [Google Maps Platform](https://cloud.google.com/maps-platform/maps/)
- [Google App Engine](https://cloud.google.com/appengine/)


## Development Environment

### Dev Server

Using ```nvmw```, a simple [nvm](https://github.com/creationix/nvm) wrapper, GeoFiddle can be served locally by running:

```
geofiddle > ./nvmw npm install
geofiddle > ./nvmw npm test
geofiddle > ./nvmw npm start
```

### Unit Tests

Code can be tested by running:
```
geofiddle > ./nvmw npm install
geofiddle > ./nvmw npm test
```

### Clean

Downloaded, generated and/or temporary files including node.js modules, nvm node.js versions, coverage reports, etc. can be removed by running:
```
geofiddle > ./nvmw npm run clean
```

### Google Maps JavaScript API

So that the Google Map can be loaded without warnings and full featured, there's the need to create a file named ```PRIVATE.json``` with your Google Maps JavaScript API key and any existing [Map ID for custom map styling](https://developers.google.com/maps/documentation/javascript/cloud-based-map-styling#cloud_tooling). Without any costs (but requiring a credit card), an API key can be created [here](https://developers.google.com/maps/documentation/javascript/get-api-key).

The file contents should look like this (although both values are dummy and will not work):

```
{
  "apiKey": "AIzaSyDg0pS7JeL2uo6IrPQ5FNV--GIrFp1M8CQ",
  "mapId": "aba6eaf2002b017f"
}
```
