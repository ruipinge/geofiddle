require.config({

    baseUrl: 'js',

    paths: {
        'domReady': 'lib/domReady-2.0.1',
        'text': 'lib/text-2.0.15',
        'async': 'lib/async-0.1.2',
        'jquery': 'lib/jquery-3.3.1',
        'underscore': 'lib/lodash-4.17.10',
        'backbone': 'lib/backbone-1.3.3',

        // From HTML5 Boilerplate (v6.1.0): https://html5boilerplate.com/
        'modernizr': 'lib/modernizr-3.6.0.min',

        // From Geodesy functions: https://github.com/chrisveness/geodesy
        'vector3d': 'lib/vector3d',
        'dms': 'lib/dms',
        'latlon-ellipsoidal': 'lib/latlon-ellipsoidal',
        'osgridref': 'lib/osgridref',

        // From K. Arthur Endsley: https://github.com/arthur-e/Wicket
        // Supports WKT and GeoJSON parsing and formatting
        'wicket': 'lib/wicket',
        'wicket-gmap3': 'lib/wicket-gmap3',

        'mdc': 'lib/material-components-web-0.40.0.min'
    },

    shim: {
        'modernizr': {
            exports: 'Modernizr'
        }
    }

});

require([

    'domReady',
    'backbone',
    'router',
    'models/convert',
    'views/top-bar',
    'views/convert-form',
    'views/convert-result',
    'views/maps/google'

], function(domReady, Backbone, Router, ConvertModel, TopBarView, ConvertFormView, ConvertResultView, GoogleMapView) {

    domReady(function() {

        var model = new ConvertModel();

        // App Top Bar view
        var topBarView = new TopBarView();
        $('body').prepend(topBarView.el);
        topBarView.render();

        // Conversion Form (top left) view
        new ConvertFormView({
            el: $('#convert-form-container'),
            model: model
        }).render();

        // Conversion Form (bottom left) view
        new ConvertResultView({
            el: $('#convert-result-container'),
            model: model
        }).render();

        // Map (top right) view
        new GoogleMapView({
            el: $('#map-container'),
            model: model
        }).render();

        // Routing
        new Router({
            model: model
        });
        Backbone.history.start({
            root: window.location.pathname
        });

    });

});
