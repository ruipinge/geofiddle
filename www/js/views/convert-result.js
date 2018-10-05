define([

    'backbone',
    'mdc',
    'text!templates/convert-result.html'

], function (Backbone, mdc, tpl) {

    return Backbone.View.extend({

        initialize: function() {
            this.listenTo(this.model, 'change:text', this.renderConversions);
        },

        renderConversions: function() {

        },

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            this.renderConversions();

            return this;
        }

    });

});
