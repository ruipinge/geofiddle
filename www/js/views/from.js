define([

    'backbone',
    'mdc',
    'text!templates/from.html'

], function (Backbone, mdc, tpl) {

    return Backbone.View.extend({

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            mdc.ripple.MDCRipple.attachTo(this.$el.find('.foo-button')[0]);

            return this;
        }

    });

});
