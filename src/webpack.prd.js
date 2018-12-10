const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'production',
    output: {
        filename: '[name].[contenthash].js',
        publicPath: 'dist/'
    },
    plugins: [

        // Replaces GOOGLE_MAPS_API_KEY variable on the code with a functional Google
        // Maps API key. This key is currently whitelisted to the following domains:
        // - ruipinge.google.io
        // - geofiddle.com
        new webpack.DefinePlugin({
            GOOGLE_MAPS_API_KEY: JSON.stringify('AIzaSyDg0pS7JeL2uo6IrPQ5FNV--GIrFp1M8CQ')
        })

    ]
});
