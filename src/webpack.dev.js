const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');


// When a GOOGLE_MAPS_API_KEY.json file exists on the project root
// it's contents will be used as the Google Maps API key.
const keyFilename = 'GOOGLE_MAPS_API_KEY.json';
var GOOGLE_MAPS_API_KEY;
try {
    GOOGLE_MAPS_API_KEY = require('../' + keyFilename);
} catch (e) {
    console.log('\x1b[33mWARNING: Google Maps API key File not found. Google Map will be loaded ' +
        'with a warning in development mode. Please create a file named "' + keyFilename +
        '" in the project root with your API key between double quotes.\x1b[0m\n');
}

module.exports = merge(common, {
    mode: 'development',
    output: {
        filename: '[name].js'
    },
    plugins: [

        // Simplifies creation of HTML files to serve the bundles
        new HtmlWebpackPlugin({
            // Uses existing HTML file instead of creating one from scratch
            template: './index.ejs',
            templateParameters: {
                includeAnalytics: false
            }
        }),

        new webpack.HotModuleReplacementPlugin(),

        // Replaces GOOGLE_MAPS_API_KEY variable on the code with the loaded key (see above)
        new webpack.DefinePlugin({
            GOOGLE_MAPS_API_KEY: JSON.stringify(GOOGLE_MAPS_API_KEY)
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, '../static'),
        hot: true
    }
});
