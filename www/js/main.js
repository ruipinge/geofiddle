require.config({

    baseUrl: 'js',

    paths: {
        'domReady': 'lib/domReady-2.0.1',
        'text': 'lib/text-2.0.15',
        'jquery': 'lib/jquery-3.3.1',
        'underscore': 'lib/lodash-4.17.10',
        'backbone': 'lib/backbone-1.3.3',
        'modernizr': 'lib/modernizr-3.6.0.min' // From HTML5 Boilerplate
    },

    shim: {
        'modernizr': {
            exports: 'Modernizr'
        }
    }

});

require([

    'domReady',
    'jquery',
    'underscore',
    'backbone',
    'modernizr'

], function(domReady) {

    domReady(function() {

        // Everything starts here!

    });

});
