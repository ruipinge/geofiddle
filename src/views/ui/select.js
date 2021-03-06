import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import {MDCSelect} from '@material/select';
import tpl from 'templates/ui/select.html';

export default Backbone.View.extend({

    className: 'mdc-select',

    events: {
        'change select': 'setValue'
    },

    initialize: function(options) {
        options || (options = {});
        this.attr = this.options.attr;
        this.listenTo(this.model, 'change:' + this.attr, this.renderValue);
    },

    setValue: function(ev) {
        var $i = $(ev.currentTarget);
        if (this.model && this.attr) {
            this.model.set(this.attr, $i.val());
        }
    },

    renderValue: function() {
        if (this.model && this.attr) {
            this.select.value = this.model.get(this.attr);
        }
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

        // Set name attribute
        if (options.attr) {
            $select.attr('name', options.attr);
        }

        this.select = new MDCSelect(this.$el[0]);

        this.renderValue();

        return this;
    }

});
