const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const basePath = path.resolve(__dirname, 'www/js');

module.exports = {
    context: basePath,
    mode: 'development',
    entry: './main.js',
    plugins: [

        // Simplifies creation of HTML files to serve the bundles
        new HtmlWebpackPlugin({
            // Uses existing HTML file instead of creating one from scratch
            template: '../index.html'
        }),

        // Fixes module order, since the hash ids are based on the relative path
        // https://webpack.js.org/guides/caching/#module-identifiers
        new webpack.HashedModuleIdsPlugin()

    ],
    output: {
        filename: '[name].[contenthash].js'
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    },
    resolve: {
        modules: [basePath, 'node_modules'],
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
                // Fixes Material Design missing browser CSS rules vendor prefixes (-moz-, -webkit-)
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
