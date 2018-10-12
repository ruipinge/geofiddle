define([

    'underscore',
    'wicket',
    'util'

], function(_, Wkt, Util) {

    var F = {};

    F.AUTO_DETECT_LABEL = 'Auto detect';
    F.AUTO_DETECT = 'auto';
    F.GEOJSON = 'geojson';
    F.WKT = 'wkt';
    F.DSV = 'dsv';

    F.OPTIONS = [{
        label: F.AUTO_DETECT_LABEL,
        value: F.AUTO_DETECT
    }, {
        label: 'GeoJSON',
        description: 'GeoJSON',
        value: F.GEOJSON
    }, {
        label: 'WKT',
        description: 'Well-known text (WKT)',
        value: F.WKT
    }, {
        label: 'DSV',
        description: 'Delimiter-separated values (DSV)',
        value: F.DSV
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

    F.autoDetect = function(s) {
        s = Util.stringClean(s);

        if (s[0] === '{') {
            return F.GEOJSON;
        } else if (/^[a-zA-Z]/.test(s)) {
            return F.WKT;
        } else if (/[,0-9.-]/.test(s.replace(/\s/g, ''))) {
            return F.DSV;
        }
    };

    F.parseDsv = function(s) {
        var vals;
        try {
            vals = Util.parseDsv(s);
        } catch (e) {
            return;
        }

        // Validation: no ordinates, or odd number of ordinates
        var len = vals.length;
        if (!len || len % 2 === 1) {
            return;
        }

        var ords = [];
        for (var i = 0; i < len; i += 2) {
            ords.push('' + vals[i] + ' ' + vals[i + 1]);
        }
        ords = ords.join(',');

        // At least 4 vertex (8 ordinates) and first point is the
        // same as last: it's a Polygon
        var wkt = new Wkt.Wkt();
        if (len > 6 && vals[0] === vals[len - 2] && vals[1] === vals[len - 1]) {
            wkt.read('POLYGON((' + ords + '))');
        } else if (len > 2) {
            wkt.read('LINESTRING(' + ords + ')');
        } else {
            wkt.read('POINT(' + ords + ')');
        }

        return wkt;
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

    F.parse = function(s, format) {

        // DSV
        if (format === F.DSV) {
            return F.parseDsv(s);
        }

        // Try WKT or GeoJSON
        return F.parseWkt(s);

    };

    F.format = function(wkt, format) {
        if (format === F.WKT) {
            return wkt.write();
        } else if (format === F.GEOJSON) {
            return JSON.stringify(wkt.toJson(), null, 4);
        } else if (format === F.DSV) {
            return _.map(_.flattenDeep(wkt.components), function(coord) {
                return '' + coord.x + ', ' + coord.y;
            }).join(', ');
        }
        throw new Error('Format not supported: ' + format + '.');
    };

    return F;

});
