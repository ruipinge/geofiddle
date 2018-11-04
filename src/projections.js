(function (root, factory) {

    // istanbul ignore next line
    if (typeof define === 'function' && define.amd) {
        // AMD (+ global for extensions)
        define(['underscore', 'geodesy/osgridref', 'geodesy/latlon-ellipsoidal', 'geofiddle-util'], function (_, OsGridRef, LatLon, Util) {
            return factory(_, OsGridRef, LatLon, Util);
        });
    } else if (typeof module !== 'undefined' && typeof exports === 'object') {
        // CommonJS
        var _ = require('underscore'),
            OsGridRef = require('geodesy/osgridref'),
            LatLon = require('geodesy/latlon-ellipsoidal'),
            Util = require('geofiddle-util');
        // eslint-disable-next-line no-undef
        module.exports = factory(_, OsGridRef, LatLon, Util);
    } else {
        // Browser
        root.Projections = factory(root._, root.OsGridRef, root.LatLon, root.Util);
    }

}(this, function (_, OsGridRef, LatLon, Util) {

    var P = {};

    P.MAX_LON = 180.0;
    P.AUTO_DETECT_LABEL = 'Auto detect';
    P.AUTO_DETECT = 'auto';
    P.WGS84 = 'wgs84';
    P.BNG = 'bng';

    P.SUPPORTED_PROJECTIONS = [P.WGS84, P.BNG];

    P.OPTIONS = [{
        label: P.AUTO_DETECT_LABEL,
        value: P.AUTO_DETECT
    }, {
        label: 'WGS84',
        description: 'World Geodetic System (WGS84)',
        value: P.WGS84
    }, {
        label: 'BNG',
        description: 'British National Grid (BNG)',
        value: P.BNG
    }];

    P.findOption = function(code) {
        return _.find(P.OPTIONS, function(obj) {
            return obj.value === code;
        });
    };

    P.getLabel = function(code) {
        return P.findOption(code).label;
    };

    P.formatAutoDetectLabel = function(code) {
        if (!code) {
            return P.AUTO_DETECT_LABEL;
        }
        var obj = P.findOption(code);
        return P.AUTO_DETECT_LABEL + ' (' + obj.label + ')';
    };

    P.autoDetect = function(s, projection) {
        if (projection && projection !== P.AUTO_DETECT) {
            return projection;
        }

        s = Util.stringClean(s);

        var numbers = _.filter(_.split(s, /[^-.\d]/), function(n) {
            return !!_.trim(n);
        });

        if (!numbers || !numbers.length) {
            return;
        }

        var largeNumbers = _.some(numbers, function(n) {
            return Math.abs(parseFloat(n)) > P.MAX_LON;
        });

        // Large numbers mean is not WGS84
        return largeNumbers ? P.BNG : P.WGS84;
    };

    P.convertBngToLatLon = function(easting, northing) {
        var osGridRef = new OsGridRef(easting, northing),
            latLon = OsGridRef.osGridToLatLon(osGridRef);

        return {
            x: latLon.lon,
            y: latLon.lat
        };
    };

    P.convertLatLonToBng = function(lat, lon) {
        var latLon = new LatLon(lat, lon),
            osGridRef = OsGridRef.latLonToOsGrid(latLon);

        return {
            x: osGridRef.easting,
            y: osGridRef.northing
        };
    };

    /**
     *
     * @param {array} components - The Wkt object components (coordinates)
     * @param {string} from - The Projection to convert from
     * @param {string} to - The Projection to convert to
     * @return {array} - The converted Wkt object components
     */
    P.convertWktComponents = function(components, from, to) {
        if (!from || !to) {
            throw new Error('Projection to convert from or to not provided.');
        }

        if (!_.includes(P.SUPPORTED_PROJECTIONS, from)) {
            throw new Error('Projection not supported: ' + from + '.');
        }

        if (!_.includes(P.SUPPORTED_PROJECTIONS, to)) {
            throw new Error('Projection not supported: ' + to + '.');
        }

        if (from === to) {
            return components;
        }

        if (_.isArray(components)) {
            return _.map(components, function(c) {
                return P.convertWktComponents(c, from, to);
            });
        }

        if (!_.has(components, 'x') || !_.has(components, 'y')) {
            throw new TypeError('Provided coordinate doesn\'t include x/y attributes.');
        }

        if (!_.isNumber(components.x) || !_.isNumber(components.y)) {
            throw new TypeError('Provided coordinate x/y attributes are not numbers.');
        }

        if (from === P.BNG && to === P.WGS84) {
            return P.convertBngToLatLon(components.x, components.y);
        } else if (from === P.WGS84 && to === P.BNG) {
            return P.convertLatLonToBng(components.y, components.x);
        }

    };

    P.convert = function(wkt, from, to) {
        wkt.components = P.convertWktComponents(wkt.components, from, to);
        return wkt;
    };

    return P;

}));
