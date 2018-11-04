define([

    'backbone'

], function(Backbone) {

    return Backbone.Router.extend({

        routes: {
            '(:format)/(:projection)/(:geom)': 'index'
        },

        initialize: function(options) {
            options || (options = {});
            this.model = options.model;
            this.listenTo(this.model, 'change', this.updateHash);
        },

        updateHash: function() {
            this.navigate(
                encodeURIComponent(this.model.getFormat()) + '/' +
                encodeURIComponent(this.model.getProjection()) + '/' +
                encodeURIComponent(this.model.get('text'))
            );
        },

        index: function(format, projection, geom) {
            this.model.set({
                format: format,
                projection: projection,
                text: geom || ''
            });
        }

    });

});
