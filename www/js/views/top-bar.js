define([

    'backbone',
    'mdc',
    'text!templates/top-bar.html'

], function (Backbone, mdc, tpl) {

    return Backbone.View.extend({

        tagName: 'header',

        className: 'mdc-top-app-bar mdc-top-app-bar--fixed',

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            mdc.topAppBar.MDCTopAppBar.attachTo(this.$el[0]);

            return this;
        }

    });

});
