const path = require('path');

module.exports = {
    context: path.resolve(__dirname, 'www/js'),
    mode: 'development',
    entry: './main.js',
    output: {
        path: path.resolve(__dirname, 'www/dist'),
        filename: 'bundle.js',
        publicPath: 'dist/'
    },
    resolve: {
        modules: [path.resolve(__dirname, 'www/js'), 'node_modules'],
        alias: {
            'underscore': 'lodash'
        }
    },
    module: {
        rules: [{
            test: /\.(html)$/,
            use: {
                loader: 'html-loader'
            }
        }, {
            test: /\.scss$/,
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader'
            }, {
                loader: 'postcss-loader'
            }, {
                loader: 'sass-loader',
                options: {
                    includePaths: ['./node_modules']
                }
            }]
        }]
    },
    devServer: {
        contentBase: path.join(__dirname, 'www')
    }
};
