import _ from 'underscore';
import Wkt from 'wicket';
import OsGridRef from 'geodesy/osgridref';
import LatLon from 'geodesy/latlon-ellipsoidal';
import Util from 'geofiddle-util';

const P = {};

P.MAX_LON = 180.0;
P.AUTO_DETECT_LABEL = 'Auto-detect';
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
    value: P.WGS84,
    srid: 4326
}, {
    label: 'BNG',
    description: 'British National Grid (BNG)',
    value: P.BNG,
    srid: 27700,
    unsupportedFormats: ['polyline5', 'polyline6']
}];

const FORMAT_PROJECTIONS = {
    'polyline5': P.WGS84,
    'polyline6': P.WGS84
};

P.findOption = function(code) {
    return _.find(P.OPTIONS, function(obj) {
        return obj.value === code;
    });
};

P.getLabel = function(code) {
    return P.findOption(code).label;
};

P.getSrid = function(code) {
    return P.findOption(code).srid;
};

P.formatAutoDetectLabel = function(code) {
    if (!code || code === P.AUTO_DETECT) {
        return P.AUTO_DETECT_LABEL;
    }
    var obj = P.findOption(code);
    return P.AUTO_DETECT_LABEL + ' (' + obj.label + ')';
};

P.autoDetect = function(s, format, projection) {
    if (projection && projection !== P.AUTO_DETECT) {
        return projection;
    }

    if (FORMAT_PROJECTIONS[format]) {
        return FORMAT_PROJECTIONS[format];
    }

    s = Util.stringClean(s);

    var ewktRegex = /^SRID=(\d+);/i,
        ewktMatch = ewktRegex.exec(s);
    if (ewktMatch && ewktMatch[1]) {
        var srid = +ewktMatch[1],
            proj = _.find(P.OPTIONS, function (p) {
                return p.srid === srid;
            });
        return proj ? proj.value : undefined;
    }

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
        throw new Error('Projection to convert from and/or to not provided.');
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

    if (!_.isNumber(components.x) || !_.isNumber(components.y) ||
        _.isNaN(components.x) || _.isNaN(components.y)) {
        throw new TypeError('Provided coordinate x/y attributes are not numbers.');
    }

    if (from === P.BNG && to === P.WGS84) {
        return P.convertBngToLatLon(components.x, components.y);
    } else if (from === P.WGS84 && to === P.BNG) {
        return P.convertLatLonToBng(components.y, components.x);
    }
};

P.convert = function(wkt, from, to) {

    // Clone wkt so that the input keeps untouched
    var converted = new Wkt.Wkt(wkt.write());
    converted.components = P.convertWktComponents(converted.components, from, to);
    return converted;

};

export default P;
