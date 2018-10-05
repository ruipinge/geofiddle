define([

    'backbone',
    'models/convert',
    'mdc',
    'formats',
    'projections',
    'text!templates/convert-result.html'

], function (Backbone, ConvertModel, mdc, Formats, Projections, tpl) {

    return Backbone.View.extend({

        initialize: function() {
            this.listenTo(this.model, 'change:text', this.renderConversions);
        },

        renderConversion: function(format, projection) {
            var $h = $('<h7></h7>').text(format.label + '/' + projection.label).addClass('mdc-typography--headline6'),
                $pre = $('<pre></pre>').text(this.model.getConvertedText(format, projection));
            this.$form.append($h);
            this.$form.append($pre);
        },

        renderConversions: function() {
            this.$form.empty();

            if (!this.model.hasText()) {
                return;
            }

            if (!this.model.isValid()) {
                // TODO: render error
                return;
            }

            this.renderConversion(Formats.OPTIONS[0], Projections.OPTIONS[0]);
            // _.each(ConvertModel.FORMAT_OPTIONS, function(format) {
            //     _.each(ConvertModel.PROJECTION_OPTIONS, function(projection) {
            //         this.renderConversion(format, projection);
            //     }.bind(this));
            // }.bind(this));
        },

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            this.$form = this.$el.find('.form');

            this.renderConversions();

            return this;
        }

    });

});
