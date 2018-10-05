define([

    'backbone',
    'mdc',
    'text!templates/ui/select.html'

], function (Backbone, mdc, tpl) {

    return Backbone.View.extend({

        className: 'mdc-select',

        options: {
            label: null,
            selected: null,
            options: [{
                label: null,
                value: null
            }, {
                label: null,
                value: null
            }]
        },

        render: function(template) {
            var html = _.template(template || tpl, {});
            this.$el.html(html);

            var options = this.options || {},
                $label = this.$el.find('label'),
                $select = this.$el.find('select');

            // Set (or hide) label
            if (options.label) {
                $label.text(options.label);
            } else {
                $label.remove();
            }

            // Add all options
            _.each(options.options, function(option) {
                $select.append($('<option></option>')
                    .attr('value', option.value)
                    .text(option.label));
            }.bind(this));

            // Set selected value
            if (options.selected) {
                $select.val(options.selected);
            }

            mdc.select.MDCSelect.attachTo(this.$el[0]);

            return this;
        }

    });

});
