let webpack = require('webpack');
let path = require('path');
let baseConfig = require('./webpack.config.base');

baseConfig.output = {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/build/',
    filename: '[name].js'
};
baseConfig.devServer = {
    contentBase: './demo',
    host: '0.0.0.0',
    port: '8084'
};

module.exports = baseConfig;