import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Formats from 'formats';
import Projections from 'projections';
import tpl from 'templates/convert-result.html';

export default Backbone.View.extend({

    initialize: function() {
        this.listenTo(this.model, 'change', this.renderConversions);
    },

    renderConversion: function(format, projection) {
        if (format === Formats.AUTO_DETECT || projection === Projections.AUTO_DETECT) {
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

        var format = this.model.getFormat(true),
            proj = this.model.getProjection(true);

        _.each(Formats.OPTIONS, function(f) {
            _.each(Projections.OPTIONS, function(p) {
                if (f.value === format &&
                    p.value === proj) {
                    return;
                }
                if (_.includes(p.unsupportedFormats, f.value)) {
                    return;
                }
                this.renderConversion(f.value, p.value, wkt);
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
