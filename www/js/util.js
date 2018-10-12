define([

    'underscore'

], function(_) {

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

    return Util;

});
