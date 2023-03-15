import {fileURLToPath} from 'url';
import {merge} from 'webpack-merge';
import common from './webpack.common.mjs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

// When a PRIVATE.json file exists on the project root
// it should contain the Google Maps API key and Map ID.
const keyFilename = 'PRIVATE.json';
var privateConfig;
try {
    privateConfig = require('../' + keyFilename);
} catch (e) {
    privateConfig = {
        apiKey: '',
        mapId: ''
    };
    // eslint-disable-next-line no-console
    console.log('\x1b[33mWARNING: Google Maps API key file not found. Google Map will be loaded ' +
        'with a warning in development mode. Please create a file named "' + keyFilename +
        '" in the project root with the Google Maps API key (see README.md).\x1b[0m\n');
}

export default merge(common, {
    mode: 'development',
    devtool: 'inline-cheap-source-map',
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

        new webpack.DefinePlugin({

            // Replaces GOOGLE_MAPS_API_KEY variable on the code with the loaded key (see above)
            GOOGLE_MAPS_API_KEY: JSON.stringify(privateConfig.apiKey),

            // Replaces GOOGLE_MAPS_MAP_ID variable on the code with the loaded Map ID (see above)
            GOOGLE_MAPS_MAP_ID: JSON.stringify(privateConfig.mapId),

            // Disables Sentry error reporting on non-production environments
            SENTRY_DSN: false
        })
    ],
    devServer: {
        static: {
            directory: fileURLToPath(new URL('../static', import.meta.url)),
        },
        hot: true
    }
});
