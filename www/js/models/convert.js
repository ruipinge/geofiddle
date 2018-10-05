define([

    'backbone',
    'osgridref',
    'wkt',
    'formats',
    'projections'

], function(Backbone, OsGridRef, Wkt, Formats, Projections) {

    return Backbone.Model.extend({

        defaults: {
            text: null,
            projection: Formats.AUTO_DETECT,
            format: Formats.AUTO_DETECT
        },

        hasText: function() {
            return !!_.trim(this.get('text'));
        },

        getFormat: function(autoDetect) {
            var format = this.get('format');
            if (autoDetect && format === Formats.AUTO_DETECT) {
                return Formats.autoDetectFormat(this.get('text')) || format;
            }
            return format;
        },

        getProjection: function(autoDetect) {
            var projection = this.get('projection');
            if (autoDetect && projection === Projections.AUTO_DETECT) {
                return Projections.autoDetectProjection(this.get('text')) || projection;
            }
            return projection;
        },

        getConvertedText: function(format, projection) {
            return 'pinge'; // TODO:
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
        }

    });

});
