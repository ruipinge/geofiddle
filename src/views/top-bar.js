define([

    'backbone',
    '@material/top-app-bar',
    'templates/top-bar.html'

], function (Backbone, topAppBar, tpl) {

    return Backbone.View.extend({

        tagName: 'header',

        className: 'mdc-top-app-bar mdc-top-app-bar--fixed',

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            topAppBar.MDCTopAppBar.attachTo(this.$el[0]);

            return this;
        }

    });

});
