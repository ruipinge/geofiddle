define([

    'underscore',
    'osgridref',
    'latlon-ellipsoidal',
    'util'

], function(_, OsGridRef, LatLon, Util) {

    var MAX_LON = 180.0,
        AUTO_DETECT = 'auto',
        WGS84 = 'wgs84',
        BNG = 'bng',
        AUTO_DETECT_OPTION = {
            label: 'Auto detect',
            value: AUTO_DETECT
        },
        WGS84_OPTION = {
            label: 'WGS84',
            description: 'World Geodetic System (WGS84)',
            value: WGS84
        },
        BNG_OPTION = {
            label: 'BNG',
            description: 'British National Grid (BNG)',
            value: BNG
        },
        SUPPORTED_PROJECTIONS = [WGS84, BNG],
        LABELS = {};

    LABELS[WGS84] = WGS84_OPTION.label;
    LABELS[BNG] = BNG_OPTION.label;
    LABELS[AUTO_DETECT] = AUTO_DETECT_OPTION.label;

    var convertBngToLatLon = function(easting, northing) {
        var osGridRef = new OsGridRef(easting, northing),
            latLon = OsGridRef.osGridToLatLon(osGridRef);

        return {
            x: latLon.lon,
            y: latLon.lat
        };
    };

    var convertLatLonToBng = function(lat, lon) {
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
    var convert = function(components, from, to) {
        if (!from || !to) {
            throw new Error('Projection to convert from or to not provided.');
        }

        if (!_.includes(SUPPORTED_PROJECTIONS, from)) {
            throw new Error('Projection not supported: ' + from + '.');
        }

        if (!_.includes(SUPPORTED_PROJECTIONS, to)) {
            throw new Error('Projection not supported: ' + to + '.');
        }

        if (from === to) {
            return components;
        }

        if (_.isArray(components)) {
            return _.map(components, function(c) {
                return convert(c, from, to);
            });
        }

        if (!_.has(components, 'x') || !_.has(components, 'y')) {
            throw new TypeError('Provided coordinate doesn\'t include x/y attributes.');
        }

        if (!_.isNumber(components.x) || !_.isNumber(components.y)) {
            throw new TypeError('Provided coordinate x/y attributes are not numbers.');
        }

        if (from === BNG && to === WGS84) {
            return convertBngToLatLon(components.x, components.y);
        } else if (from === WGS84 && to === BNG) {
            return convertLatLonToBng(components.y, components.x);
        }

    };

    return {

        AUTO_DETECT: AUTO_DETECT,

        WGS84: WGS84,

        BNG: BNG,

        AUTO_DETECT_OPTION: AUTO_DETECT_OPTION,

        OPTIONS: [
            WGS84_OPTION,
            BNG_OPTION
        ],

        formatAutoDetectLabel: function(proj) {
            if (!proj) {
                return LABELS[AUTO_DETECT];
            }
            return LABELS[AUTO_DETECT] + ' (' + LABELS[proj] + ')';
        },

        autoDetect: function(s) {
            s = Util.stringClean(s);

            var numbers = _.filter(_.split(s, /[^-.\d]/), function(n) {
                return !!_.trim(n);
            });

            if (!numbers || !numbers.length) {
                return;
            }

            var largeNumbers = _.some(numbers, function(n) {
                return Math.abs(parseFloat(n)) > MAX_LON;
            });

            // Large numbers mean is not WGS84
            return largeNumbers ? BNG : WGS84;
        },

        getLabel: function(code) {
            return LABELS[code];
        },

        convert: convert

    };

});
