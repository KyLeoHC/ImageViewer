var webpack = require('webpack');
var path = require('path');
var baseConfig = require('./webpack.config.base');

baseConfig.output = {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js'
};
baseConfig.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
    })
);

module.exports = baseConfig;