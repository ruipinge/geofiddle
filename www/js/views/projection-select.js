define([

    'views/ui/select',
    'models/convert',
    'projections'

], function (SelectView, ConvertModel, Projections) {

    return SelectView.extend({

        options: {
            label: 'Projection',
            attr: 'projection',
            options: Projections.OPTIONS
        },

        initialize: function(options) {
            options || (options = {});

            this.listenTo(this.model, 'change:text', this.renderAutoDetect);

            SelectView.prototype.initialize.apply(this, options);
        },

        renderAutoDetect: function() {
            var format = Projections.autoDetect(this.model.get('text')),
                label = Projections.formatAutoDetectLabel(format);
            this.$el.find('option[value="auto"]').text(label);
        }

    });

});
