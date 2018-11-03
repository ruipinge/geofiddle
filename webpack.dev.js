const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    output: {
        filename: '[name].js'
    },
    devServer: {
        contentBase: path.join(__dirname, 'www')
    }
});
