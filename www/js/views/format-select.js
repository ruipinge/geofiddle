define([

    'views/ui/select',
    'models/convert',
    'formats'

], function (SelectView, ConvertModel, Formats) {

    return SelectView.extend({

        options: {
            label: 'Format',
            attr: 'format',
            options: _.concat([Formats.AUTO_DETECT_OPTION], Formats.OPTIONS)
        },

        initialize: function(options) {
            options || (options = {});

            this.listenTo(this.model, 'change:text', this.renderAutoDetect);

            SelectView.prototype.initialize.apply(this, options);
        },

        renderAutoDetect: function() {
            var format = Formats.autoDetect(this.model.get('text')),
                label = Formats.formatAutoDetectLabel(format);
            this.$el.find('option[value="auto"]').text(label);
        }

    });

});
