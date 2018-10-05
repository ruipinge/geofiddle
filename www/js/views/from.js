define([

    'backbone',
    'mdc',
    'views/format-select',
    'views/projection-select',
    'text!templates/from.html'

], function (Backbone, mdc, FormatSelectView, ProjectionSelectView, tpl) {

    return Backbone.View.extend({

        render: function() {
            var html = _.template(tpl, {});
            this.$el.html(html);

            var view = new FormatSelectView();
            this.$el.find('.form-toolbar').append(view.el);
            view.render();

            view = new ProjectionSelectView();
            this.$el.find('.form-toolbar').append(view.el);
            view.render();

            return this;
        }

    });

});
