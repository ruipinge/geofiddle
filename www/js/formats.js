define([

    'wicket',
    'util'

], function(Wkt, Util) {

    var AUTO_DETECT = 'auto',
        GEOJSON = 'geojson',
        WKT = 'wkt',
        AUTO_DETECT_OPTION = {
            label: 'Auto detect',
            value: AUTO_DETECT
        },
        GEOJSON_OPTION = {
            label: 'GeoJSON',
            description: 'GeoJSON',
            value: GEOJSON
        },
        WKT_OPTION = {
            label: 'WKT',
            description: 'Well-known text (WKT)',
            value: WKT
        },
        LABELS = {};

    LABELS[GEOJSON] = GEOJSON_OPTION.label;
    LABELS[WKT] = WKT_OPTION.label;
    LABELS[AUTO_DETECT] = AUTO_DETECT_OPTION.label;

    return {

        AUTO_DETECT: AUTO_DETECT,

        GEOJSON: GEOJSON,

        WKT: WKT,

        AUTO_DETECT_OPTION: AUTO_DETECT_OPTION,

        OPTIONS: [
            GEOJSON_OPTION,
            WKT_OPTION
        ],

        formatAutoDetectLabel: function(format) {
            if (!format) {
                return LABELS[AUTO_DETECT];
            }
            return LABELS[AUTO_DETECT] + ' (' + LABELS[format] + ')';
        },

        autoDetect: function(s) {
            s = Util.stringClean(s);

            if (s[0] === '{') {
                return GEOJSON;
            } else if (/^[a-zA-Z]/.test(s)) {
                return WKT;
            }
        },

        parse: function(s, format) {
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
        },

        format: function(wkt, format) {
            if (format === WKT) {
                return wkt.write();
            } else if (format === GEOJSON) {
                return JSON.stringify(wkt.toJson(), null, 4);
            }
        },

        getLabel: function(code) {
            return LABELS[code];
        }

    };

});
