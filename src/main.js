import './main.scss';

import * as Sentry from '@sentry/browser';

// Sentry DSN will be replaced with webpack DefinePlugin
// eslint-disable-next-line no-undef
const dsn = SENTRY_DSN;
if (dsn) {
    Sentry.init({ dsn: dsn });
}

import $ from 'jquery';
import Backbone from 'backbone';
import Router from 'router';
import ConvertModel from 'models/convert';
import TopBarView from 'views/top-bar';
import ConvertFormView from 'views/convert-form';
import ConvertResultView from 'views/convert-result';
import GoogleMapView from 'views/maps/google';

$(function() {

    const model = new ConvertModel();

    // App Top Bar view
    const topBarView = new TopBarView();
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
