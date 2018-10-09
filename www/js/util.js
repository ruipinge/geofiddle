define([

    'underscore'

], function(_) {

    return {

        stringClean: function(s) {
            // TODO: replace multiple spaces with just one
            return _.trim(s).replace(/(?:\r\n|\r|\n)/g, ' ');
        }

    };

});
