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
        }
    };

    F.parse = function(s, format) {
        s = Util.stringClean(s);

        var wkt = new Wkt.Wkt();

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

    F.format = function(wkt, format) {
        if (format === F.WKT) {
            return wkt.write();
        } else if (format === F.GEOJSON) {
            return JSON.stringify(wkt.toJson(), null, 4);
        }
        throw new Error('Format not supported: ' + format + '.');
    };

    return F;

});
