const path = require('path');

module.exports = {
    context: path.resolve(__dirname, 'www/js'),
    mode: 'development',
    entry: './main.js',
    output: {
        filename: 'bundle.js',
        publicPath: '/dist/'
    },
    resolve: {
        modules: [path.resolve(__dirname, 'www/js'), 'node_modules'],
        alias: {
            'underscore': 'lodash',
            'mdc': path.resolve(__dirname, 'www/js/lib/material-components-web-0.40.0.min'),
        }
    },
    module: {
        rules: [{
            test: /\.(html)$/,
            use: {
                loader: 'html-loader'
            }
        }]
    },
    devServer: {
        contentBase: path.join(__dirname, 'www')
    }
};
