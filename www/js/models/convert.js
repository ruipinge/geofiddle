define([

    'backbone',
    'wkt',
    'formats',
    'projections'

], function(Backbone, Wkt, Formats, Projections) {

    return Backbone.Model.extend({

        defaults: {
            text: null,
            projection: Formats.AUTO_DETECT,
            format: Formats.AUTO_DETECT
        },

        getWkt: function() {
            var format = this.getFormat(true);
            return Formats.parse(this.get('text'), format);
        },

        getFormat: function(autoDetect) {
            var format = this.get('format');
            if (autoDetect && format === Formats.AUTO_DETECT) {
                return Formats.autoDetect(this.get('text')) || format;
            }
            return format;
        },

        getProjection: function(autoDetect) {
            var projection = this.get('projection');
            if (autoDetect && projection === Projections.AUTO_DETECT) {
                return Projections.autoDetect(this.get('text')) || projection;
            }
            return projection;
        },

        getConvertedText: function(toFormat, toProjection, wkt) {
            var fromProjection = this.getProjection(true);

            if (!fromProjection) {
                return;
            }

            wkt || (wkt = this.getWkt());
            if (!wkt) {
                return;
            }

            wkt.components = Projections.convert(wkt.components, fromProjection, toProjection);

            return Formats.format(wkt, toFormat);
        }

    });

});
