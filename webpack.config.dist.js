let webpack = require('webpack');
let path = require('path');
let baseConfig = require('./webpack.config.base');

baseConfig.output = {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js'
};
// baseConfig.plugins = baseConfig.plugins.concat([
//     new webpack.DefinePlugin({
//         'process.env': {
//             NODE_ENV: JSON.stringify('production'),
//         }
//     }),
//     new webpack.optimize.ModuleConcatenationPlugin(),
//     new webpack.optimize.UglifyJsPlugin({
//         compress: {
//             warnings: false
//         },
//         comments: false,
//         sourceMap: true
//     })
// ]);

// baseConfig.devtool = 'source-map';
baseConfig.mode = 'production';

module.exports = baseConfig;