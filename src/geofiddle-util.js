(function (root, factory) {

    // istanbul ignore next line
    if (typeof define === 'function' && define.amd) {
        // AMD (+ global for extensions)
        define(['underscore'], function (_) {
            return factory(_);
        });
    } else if (typeof module !== 'undefined' && typeof exports === 'object') {
        // CommonJS
        var _ = require('underscore');
        module.exports = factory(_);
    } else {
        // Browser
        root.Util = factory(root._);
    }

}(this, function (_) {

    var Util = {};

    /**
     * Cleans the provided string, namely:
     * - joining multiple lines, by replacing line breaks with a space
     * - replacing multiple space characters with a single space
     *
     * @param {string} s - The string to be cleaned.
     */
    Util.stringClean = function(s) {
        return _.trim(s).replace(/(?:\r\n|\r|\n)/g, ' ').replace(/\s+/g, ' ');
    };

    Util.parseDsv = function(s) {
        s = Util.stringClean(s);

        if (!s) {
            return [];
        }

        return _.reduce(s.split(/[#&\\:/|;,\s]/), function(memo, a) {
            if (!a) {
                return memo;
            }

            var n = _.toNumber(a);
            if (_.isNaN(n)) {
                throw Error('Invalid number: ' + a);
            }

            memo.push(n);

            return memo;

        }, []);
    };

    return Util;

}));
