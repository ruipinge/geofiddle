define([

    'views/ui/select',
    'models/convert'

], function (SelectView, ConvertModel) {

    return SelectView.extend({

        options: {
            label: 'Format',
            nameAttr: 'format',
            options: _.concat([ConvertModel.AUTO_DETECT_OPTION], ConvertModel.FORMAT_OPTIONS)
        }

    });

});
