import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Formats from 'formats';
import Projections from 'projections';
import ConvertModel from 'models/convert';
import tpl from 'templates/convert-result.html';

export default Backbone.View.extend({

    initialize: function() {
        this.listenTo(this.model, 'change', this.renderConversions);
    },

    renderConversion: function(format, projection, wkts, fromProjection) {
        if (format === Formats.AUTO_DETECT || projection === Projections.AUTO_DETECT) {
            return;
        }

        var projLabel = Projections.getLabel(projection),
            formatLabel = Formats.getLabel(format),
            $header = $('<h4></h4>').text(formatLabel + '/' + projLabel + ':');

        this.$el.append($header);

        _.each(wkts, function(wkt) {

            var converted;
            try {
                converted = ConvertModel.convert(format, projection, wkt, fromProjection);
            } catch(error) {
                converted = 'Conversion not supported.';
            }
            this.$el.append($('<pre></pre>').text(converted));

        }.bind(this));
    },

    renderConversions: function() {
        this.$el.empty();

        var format = this.model.getFormat(true),
            proj = this.model.getProjection(true);

        var wkts = this.model.buildWkts(proj);
        if (!wkts || !wkts.length) {
            return;
        }

        _.each(Formats.OPTIONS, function(f) {
            _.each(Projections.OPTIONS, function(p) {
                if (f.value === format &&
                    p.value === proj) {
                    return;
                }
                if (_.includes(p.unsupportedFormats, f.value)) {
                    return;
                }
                this.renderConversion(f.value, p.value, wkts, proj);
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
