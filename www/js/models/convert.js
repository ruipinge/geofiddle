define([

    'backbone',
    'osgridref',
    'wkt'

], function(Backbone, OsGridRef, Wkt) {

    return Backbone.Model.extend({

        defaults: {
            text: null,
            projection: 'auto',
            format: 'auto'
        },

        f: function() {
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
        },

        getConvertedText: function() {
            return this.get('convert_from_text');
        }

    }, {

        FORMAT_OPTIONS: [{
            label: 'Well-known text (WKT)',
            value: 'wkt'
        }, {
            label: 'GeoJSON',
            value: 'geojson'
        }],

        PROJECTION_OPTIONS: [{
            label: 'World Geodetic System (WGS84)',
            value: 'wgs84'
        }, {
            label: 'British National Grid (BNG)',
            value: 'bng'
        }],

        AUTO_DETECT_OPTION: {
            label: '(Auto detect)',
            value: 'auto'
        }

    });

});
