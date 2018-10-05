define([

    'views/ui/select',
    'models/convert'

], function (SelectView, ConvertModel) {

    return SelectView.extend({

        options: {
            label: 'Projection',
            name: 'projection',
            options: _.concat([ConvertModel.AUTO_DETECT_OPTION], ConvertModel.PROJECTION_OPTIONS)
        }

    });

});
