define([

    'backbone',
    'wicket',
    'formats',
    'projections'

], function(Backbone, Wkt, Formats, Projections) {

    return Backbone.Model.extend({

        defaults: {
            text: null,
            projection: Formats.AUTO_DETECT,
            format: Formats.AUTO_DETECT
        },

        buildWkt: function(projection) {
            var format = this.getFormat(true),
                wkt = Formats.parse(this.get('text'), format);
            if (!wkt || !wkt.components) {
                return;
            }
            if (!projection || projection === this.getProjection(true)) {
                return wkt;
            }
            return Projections.convert(wkt, this.getProjection(true), projection);
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

            wkt || (wkt = this.buildWkt());
            if (!wkt) {
                return;
            }

            var converted = Projections.convert(wkt, fromProjection, toProjection);

            return Formats.format(converted, toFormat);
        }

    });

});
