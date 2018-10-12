define([

    'backbone',
    'models/convert',
    'formats',
    'projections',
    'text!templates/convert-result.html'

], function (Backbone, ConvertModel, Formats, Projections, tpl) {

    return Backbone.View.extend({

        initialize: function() {
            this.listenTo(this.model, 'change', this.renderConversions);
        },

        renderConversion: function(format, projection) {
            if (format === 'auto' || projection === 'auto') {
                return;
            }

            var projLabel = Projections.getLabel(projection),
                formatLabel = Formats.getLabel(format),
                $header = $('<h4></h4>').text(formatLabel + '/' + projLabel + ':'),
                $pre = $('<pre></pre>').text(this.model.getConvertedText(format, projection));

            this.$el.append($header);
            this.$el.append($pre);
        },

        renderConversions: function() {
            this.$el.empty();

            var wkt = this.model.buildWkt();
            if (!wkt) {
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

            this.renderConversions();

            return this;
        }

    });

});
