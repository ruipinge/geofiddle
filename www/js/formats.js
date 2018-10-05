define([], function() {

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
            s = _.trim(s).replace('/[\r\n]/', '');

            if (s[0] === '{') {
                return GEOJSON;
            } else if (/^[a-zA-Z]/.test(s)) {
                return WKT;
            }
            // TODO: CSV
        }

    };

});
