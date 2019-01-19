import _ from 'underscore';
import Wkt from 'wicket';
import Util from 'geofiddle-util';

// TODO: Using custom polyline lib. Change it to '@mapbox/polyline' when (and if)
// https://github.com/mapbox/polyline/pull/41 gets merged.
import polyline from 'lib/polyline';

const F = {};

F.AUTO_DETECT_LABEL = 'Auto detect';
F.AUTO_DETECT = 'auto';
F.GEOJSON = 'geojson';
F.WKT = 'wkt';
F.EWKT = 'ewkt';
F.DSV = 'dsv';
F.POLYLINE5 = 'polyline5';
F.POLYLINE6 = 'polyline6';

F.OPTIONS = [{
    label: F.AUTO_DETECT_LABEL,
    value: F.AUTO_DETECT
}, {
    label: 'GeoJSON',
    description: 'GeoJSON',
    value: F.GEOJSON
}, {
    label: 'WKT',
    description: 'Well-Known text (WKT)',
    value: F.WKT
}, {
    label: 'EWKT',
    description: 'Extended Well-Known text (EWKT)',
    value: F.EWKT
}, {
    label: 'DSV',
    description: 'Delimiter-separated values (DSV)',
    value: F.DSV
}, {
    label: 'Polyline (5)',
    description: 'Polyline with 5 decimal precision',
    value: F.POLYLINE5,
    projection: 'wgs84'
}, {
    label: 'Polyline (6)',
    description: 'Polyline with 6 decimal precision',
    value: F.POLYLINE6,
    projection: 'wgs84'
}];

F.findOption = function(code) {
    return _.find(F.OPTIONS, function(obj) {
        return obj.value === code;
    });
};

F.getLabel = function(code) {
    return F.findOption(code).label;
};

F.formatAutoDetectLabel = function(code) {
    if (!code) {
        return F.AUTO_DETECT_LABEL;
    }
    var obj = F.findOption(code);
    return F.AUTO_DETECT_LABEL + ' (' + obj.label + ')';
};

F.autoDetect = function(s, format) {
    if (format && format !== F.AUTO_DETECT) {
        return format;
    }

    s = Util.stringClean(s);

    if (s[0] === '{') {
        return F.GEOJSON;
    } else if (/^SRID=\d+;[A-Z]/i.test(s)) {
        return F.EWKT;
    } else if (/^[a-zA-Z]+\s*\(/.test(s)) {
        return F.WKT;
    } else if (/[,0-9.-]/.test(s.replace(/\s/g, ''))) {
        return F.DSV;
    } else if (s && s.indexOf(' ') === -1) {
        var coords = F.parsePolylineCoordinates(s, 5),
            wgs84overflow = _.some(coords, function (coord) {
                return Math.abs(coord[0]) > 90 || Math.abs(coord[1]) > 180;
            });

        return wgs84overflow ? F.POLYLINE6 : F.POLYLINE5;
    }
};

/**
 * Build a Wicket object given the list of ordinates. The resulting geometry type
 * will take the ordinate length and first/last value pairs into account.
 *
 * @param {number[]} ordinates - Complete and flat list of ordinates.
 * @returns {Wicket}
 */
F.buildWkt = function(ordinates) {
    ordinates || (ordinates = []);

    // Validation: no ordinates, or odd number of ordinates
    var len = ordinates.length;
    if (!len || len % 2 === 1) {
        return;
    }

    var ords = [];
    for (var i = 0; i < len; i += 2) {
        ords.push('' + ordinates[i] + ' ' + ordinates[i + 1]);
    }
    ords = ords.join(',');

    // At least 4 vertex (8 ordinates) and first point is the
    // same as last: it's a Polygon
    var wkt = new Wkt.Wkt();
    if (len > 6 && ordinates[0] === ordinates[len - 2] && ordinates[1] === ordinates[len - 1]) {
        wkt.read('POLYGON((' + ords + '))');
    } else if (len > 2) {
        wkt.read('LINESTRING(' + ords + ')');
    } else {
        wkt.read('POINT(' + ords + ')');
    }

    return wkt;
};

F.parseDsv = function(s) {
    var ords;
    try {
        ords = Util.parseDsv(s);
    } catch (e) {
        return;
    }

    return F.buildWkt(ords);
};

F.parsePolylineCoordinates = function(s, precision) {
    s = Util.stringClean(s);
    return polyline.decode(s, precision);
};

F.parsePolyline = function(s, precision) {
    var coords = F.parsePolylineCoordinates(s, precision);

    if (!coords || !coords.length) {
        return;
    }

    var ords = [];
    for (var i = 0; i < coords.length; i += 1) {
        ords.push(coords[i][1]);
        ords.push(coords[i][0]);
    }

    return F.buildWkt(ords);
};

F.parseWkt = function(s) {
    s = Util.stringClean(s);
    var wkt = new Wkt.Wkt();

    // WKT or GeoJSON
    try {

        // Read in any kind of WKT or GeoJSON string
        wkt.read(s);

        // Forces validation, throwing exception when invalid
        // Eg. a 'POIT(1 2)' is valid WKT for parsing, but not its Geometry
        wkt.toJson();

        if (!wkt.components) {
            return;
        }

        return wkt;

    } catch (e) {
        return;
    }
};

F.parseEwkt = function (s) {
    return F.parseWkt(s.split(';')[1]);
};

/**
 * Parses the given string with the given format.
 *
 * @param {string} s - The string to be parsed.
 * @param {string} format - The parsing format.
 * @returns {Wicket}
 */
F.parse = function(s, format) {

    // DSV
    if (format === F.DSV) {
        return F.parseDsv(s);
    }

    // EWKT
    if (format === F.EWKT) {
        return F.parseEwkt(s);
    }

    // Polyline
    if (format === F.POLYLINE5) {
        return F.parsePolyline(s, 5);
    }
    if (format === F.POLYLINE6) {
        return F.parsePolyline(s, 6);
    }

    // Try WKT or GeoJSON
    return F.parseWkt(s);

};

/**
 * Format the given list of ordinates using the given (or default) separators. The ordinates
 * are paired in groups of two to form coordinates, making it mandatory for the list to have
 * an even number of elements.
 *
 * Eg. [1, 2, 3, 4] will be formatted as '1 2, 3 4' using the default separators.
 *
 * @param {number[]} ordinates - Complete and flat list of ordinates.
 * @param {Object} options - Holds optional parameters.
 * @param {string} options.ordinateSep (optional) - Ordinate separator. Default is ' ' (space).
 * @param {string} options.coordinateSep (optional) - Coordinate pair separator. Default is ', '.
 * @returns {string}
 */
F.formatOrdinates = function(ordinates, options) {
    options || (options = {});

    var ordinateSep = options.ordinateSep || ' ',
        coordinateSep = options.coordinateSep || ', ',
        ords = [];

    for (var i = 0; i < ordinates.length; i += 2) {
        ords.push('' + ordinates[i] + ordinateSep + ordinates[i + 1]);
    }
    return ords.join(coordinateSep);
};

/**
 * Format the given Wicket components.
 *
 * Eg. [{ x: 1, y: 2 }, { x: 3, y: 4 }] will be formatted as '1 2, 3 4' using the
 * default separators.
 *
 * @param {Object[]} components - Wicket.components array.
 * @param {Object} options - Holds optional parameters (see formatOrdinates()).
 * @returns {string}
 */
F.formatComponents = function(components, options) {
    return F.formatOrdinates(_.reduce(_.flattenDeep(components), function(memo, comp) {
        memo.push(comp.x);
        memo.push(comp.y);
        return memo;
    }, []), options);
};

/**
 * Format the given Wicket object in the requested format.
 *
 * @param {Wicket} wkt - Wicket object.
 * @param {string} format - Format to encode into.
 * @param {Object} options - Holds optional parameters (see formatOrdinates()).
 * @param {number} options.srid - SRID. Mandatory for EWKT format.
 * @returns {string}
 */
F.format = function(wkt, format, options) {
    options || (options = {});

    if (format === F.WKT) {
        return wkt.write();
    } else if (format === F.EWKT) {
        return 'SRID=' + (options.srid || '') + ';' + (wkt.write() || '');
    } else if (format === F.GEOJSON) {
        return JSON.stringify(wkt.toJson(), null, 4);
    } else if (format === F.DSV) {
        return F.formatComponents(wkt.components, options);
    } else if (format === F.POLYLINE5) {
        return polyline.fromGeoJSON(wkt.toJson(), 5);
    } else if (format === F.POLYLINE6) {
        return polyline.fromGeoJSON(wkt.toJson(), 6);
    }
    throw new Error('Format not supported: ' + format + '.');
};

export default F;
