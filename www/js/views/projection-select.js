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
                label: 'World Geodetic System (WGS84)',
                value: 'wgs84'
            }, {
                label: 'British National Grid (BNG)',
                value: 'bng'
            }]
        }

    });

});
