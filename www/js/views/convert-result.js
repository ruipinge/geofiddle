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
            this.listenTo(this.model, 'change', this.renderConversions);
        },

        renderConversion: function(format, projection) {
            var projLabel = Projections.getLabel(projection),
                formatLabel = Formats.getLabel(format),
                $pre = $('<pre></pre>').text(
                    '// ' + formatLabel + '/' + projLabel + '\n' +
                    this.model.getConvertedText(format, projection));
            this.$scrollable.append($pre);
        },

        renderConversions: function() {
            this.$scrollable.empty();

            var wkt = this.model.getWkt();
            if (!wkt || !wkt.components) {
                return;
            }

            _.each(Formats.OPTIONS, function(format) {
                _.each(Projections.OPTIONS, function(projection) {
                    if (format.value === this.model.getFormat(true) &&
                        projection.value === this.model.getProjection(true)) {
                        return;
                    }
                    this.renderConversion(format.value, projection.value, wkt);
                }.bind(this));
            }.bind(this));
        },

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            this.$scrollable = this.$el.find('.scrollable');

            this.renderConversions();

            return this;
        }

    });

});
