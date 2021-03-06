import _ from 'underscore';
import Backbone from 'backbone';
import Formats from 'formats';
import Projections from 'projections';
import Util from 'geofiddle-util';

const GEOM_TEXT_SEPARATOR = '\n\n',
    GEOM_REGEX_SEPARATOR = /\n\s*\n/;

export default Backbone.Model.extend({

    defaults: {
        text: null,
        projection: Formats.AUTO_DETECT,
        format: Formats.AUTO_DETECT
    },

    /**
     * Returns the list of the input geometries (text) having the given (or default)
     * separator into account.
     *
     * @param {string|regexp} sep - The input text separator (default: /\n\s*\n/)
     * @returns {string[]}
     */
    getTexts: function(sep) {
        sep || (sep = GEOM_REGEX_SEPARATOR);
        var text = this.get('text') || '';
        return _.filter(text.split(sep), function(t) {
            return !!Util.stringClean(t);
        });
    },

    /**
     * Returns the n-th geometry from the input list (text) having the given
     * (or default) separator into account.
     *
     * @param {number} i - Input text index
     * @param {string|regexp} sep - Input text separator (default: /\n\s*\n/)
     * @returns {string}
     */
    getText: function(i, sep) {
        i || (i = 0);
        return this.getTexts(sep)[i];
    },

    /**
     * Returns the first geometry from the input list (text) having the given
     * (or default) separator into account. Format and Projection auto-detection
     * will use the first input geometry only.
     *
     * @param {string|regexp} sep - Input text separator (default: /\n\s*\n/)
     * @returns {string}
     */
    getFirstText: function(sep) {
        return this.getText(0, sep);
    },

    buildWkts: function(projection) {
        var format = this.getFormat(true),
            fromProjection = this.getProjection(true);

        return _.filter(_.map(this.getTexts(), function(text) {

            const wkt = Formats.parse(text, format);

            if (!wkt) {
                return;
            }

            if (!projection || projection === fromProjection) {
                return wkt;
            }

            return Projections.convert(wkt, fromProjection, projection);

        }.bind(this)), function(w) {
            return !!w;
        });
    },

    getFormat: function(autoDetect) {
        var format = this.get('format');
        if (autoDetect && format === Formats.AUTO_DETECT) {
            return Formats.autoDetect(this.getFirstText()) || format;
        }
        return format;
    },

    getProjection: function(autoDetect) {
        var projection = this.get('projection');
        if (autoDetect && projection === Projections.AUTO_DETECT) {
            var format = this.getFormat(true);
            return Projections.autoDetect(this.getFirstText(), format) || projection;
        }
        return projection;
    },

    addGeomFromOrdinates: function(ordinates, fromProjection) {
        fromProjection || (fromProjection = Projections.WGS84);

        var wkt = Formats.buildWkt(ordinates),
            toProjection = this.getProjection(true) || fromProjection,
            toFormat = this.getFormat(true) || Formats.DSV;

        if (!wkt) {
            return;
        }

        if (toProjection === Projections.AUTO_DETECT) {
            toProjection = fromProjection;
        }

        if (toFormat === Formats.AUTO_DETECT) {
            toFormat = Formats.DSV;
        }

        wkt = Projections.convert(wkt, fromProjection, toProjection);

        const text = this.get('text') || '',
            ss = [Formats.format(wkt, toFormat)];

        if (Util.stringClean(text)) {
            ss.push(text);
        }

        this.set({
            text: ss.join(GEOM_TEXT_SEPARATOR)
        });
    }

}, {

    convert: function(toFormat, toProjection, wkt, fromProjection) {

        if (!fromProjection) {
            return;
        }

        if (!wkt) {
            return;
        }

        var converted = Projections.convert(wkt, fromProjection, toProjection);

        return Formats.format(converted, toFormat, {
            srid: Projections.getSrid(toProjection)
        });

    }

});
