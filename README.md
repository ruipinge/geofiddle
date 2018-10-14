# GeoFiddle [![Build Status](https://travis-ci.org/ruipinge/geofiddle.svg?branch=master)](https://travis-ci.org/ruipinge/geofiddle) [![Coverage Status](https://coveralls.io/repos/github/ruipinge/geofiddle/badge.svg?branch=master)](https://coveralls.io/github/ruipinge/geofiddle?branch=master)

Plot, share, and convert geometries using different formats and projections. Try it [here](https://ruipinge.github.com/geofiddle).

Some of the most notable features:

- Format and Projection auto detection
- Direct links for easy sharing of geometries and conversions
- Area and distance measurements (under development!)
- Command line utility (node.js) for scripting and batch processing (under development!)

Supported formats:

- [GeoJSON](http://geojson.org/)
- [Well-Known Text](https://en.wikipedia.org/wiki/Well-known_text) (WKT)
- [Polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) (under development!)
- [Delimiter-separated values](https://en.wikipedia.org/wiki/Delimiter-separated_values) (DSV)

Supported projections:

- [World Geodetic System 1984](https://en.wikipedia.org/wiki/World_Geodetic_System) (WGS84)
- [British National Grid](https://en.wikipedia.org/wiki/Ordnance_Survey_National_Grid) (BNG) aka Ordnance Survey National Grid


## Demo and Examples

Try writting some of the following geometries [here](https://ruipinge.github.com/geofiddle):

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
- [Geodesy](https://github.com/chrisveness/geodesy) for projection conversions
- [RequireJS](https://requirejs.org/), [Backbone](http://backbonejs.org/), [jQuery](https://jquery.com/), [Lodash](https://lodash.com/), [Jest](https://jestjs.io/)
- [HTML5 Boilerplate](https://html5boilerplate.com/), [Material Components](https://github.com/material-components/material-components-web)


## Development Environment

Using [nvm](https://github.com/creationix/nvm), GeoFiddle can be served locally by running:

```
geofiddle > ./nvmw npm install
geofiddle > ./nvmw npm test
geofiddle > ./nvmw npm start
```

Code can be tested by running:
```
geofiddle > ./nvmw npm install
geofiddle > ./nvmw npm test
```

Run ```./nvmw npm run clean``` to remove all downloaded, generated and/or temporary files including node.js modules, nvm node.js versions, coverage reports, etc.
