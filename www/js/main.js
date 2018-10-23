require([

    'jquery',
    'backbone',
    'router',
    'models/convert',
    'views/top-bar',
    'views/convert-form',
    'views/convert-result',
    'views/maps/google'

], function($, Backbone, Router, ConvertModel, TopBarView, ConvertFormView, ConvertResultView, GoogleMapView) {

    $(function() {

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
