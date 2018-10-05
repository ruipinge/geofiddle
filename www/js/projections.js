define([

    'underscore'

], function(_) {

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
        LABELS = {};

    LABELS[WGS84] = WGS84_OPTION.label;
    LABELS[BNG] = BNG_OPTION.label;
    LABELS[AUTO_DETECT] = AUTO_DETECT_OPTION.label;

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
            s = _.trim(s).replace('/[\r\n]/', '');

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
        }

    };

});
