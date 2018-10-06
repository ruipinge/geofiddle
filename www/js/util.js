define([

    'underscore'

], function(_) {

    return {

        stringClean: function(s) {
            return _.trim(s).replace(/(?:\r\n|\r|\n)/g, ' ');
        }

    };

});
