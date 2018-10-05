require.config({

    baseUrl: 'js',

    paths: {
        'domReady': 'lib/domReady-2.0.1',
        'text': 'lib/text-2.0.15',
        'jquery': 'lib/jquery-3.3.1',
        'underscore': 'lib/lodash-4.17.10',
        'backbone': 'lib/backbone-1.3.3',

        // From HTML5 Boilerplate (v6.1.0): https://html5boilerplate.com/
        'modernizr': 'lib/modernizr-3.6.0.min',

        // From Geodesy functions: https://github.com/chrisveness/geodesy
        'vector3d': 'lib/vector3d',
        'dms': 'lib/dms',
        'latlon-ellipsoidal': 'lib/latlon-ellipsoidal',
        'osgridref': 'lib/osgridref',

        // From K. Arthur Endsley: https://github.com/arthur-e/Wicket
        // Supports WKT and GeoJSON parsing and formatting
        'wkt': 'lib/wicket'
    },

    shim: {
        'modernizr': {
            exports: 'Modernizr'
        },
        'vector3d': {
            exports: 'Vector3d'
        },
        'dms': {
            exports: 'Dms'
        },
        'latlon-ellipsoidal': {
            deps: [
                'vector3d',
                'dms'
            ],
            exports: 'LatLon'
        },
        'osgridref': {
            deps: ['latlon-ellipsoidal'],
            exports: 'OsGridRef'
        }
    }

});

require([

    'domReady',
    'osgridref',
    'wkt',
    'jquery',
    'underscore',
    'backbone',
    'modernizr'

], function(domReady, OsGridRef, Wkt) {

    domReady(function() {

        var osGridRef = new OsGridRef(429157, 623009),
            latLon = OsGridRef.osGridToLatLon(osGridRef);

        console.log(osGridRef.easting, osGridRef.northing);
        console.log(latLon.lat, latLon.lon);


        var wkt = new Wkt.Wkt();
        // Read in any kind of WKT string
        wkt.read('POLYGON ((30 10, 10 20, 20 40, 40 40, 30 10))');
        // Convert to GeoJSON
        console.log(wkt.toJson()); // Outputs an object
        console.log(JSON.stringify(wkt.toJson())); // Outputs a string

    });

});
