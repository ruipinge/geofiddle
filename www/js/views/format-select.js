define([

    'views/ui/select'

], function (SelectView) {

    return SelectView.extend({

        options: {
            label: 'Projection',
            selected: 'auto',
            options: [{
                label: '(Auto detect)',
                value: 'auto'
            }, {
                label: 'Well-known text (WKT)',
                value: 'wkt'
            }, {
                label: 'GeoJSON',
                value: 'geojson'
            }]
        }

    });

});
