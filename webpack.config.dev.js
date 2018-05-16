let webpack = require('webpack');
let path = require('path');
let baseConfig = require('./webpack.config.base');

baseConfig.output = {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/build/',
    filename: '[name].js'
};
baseConfig.devServer = {
    hot: false,
    inline: true,
    open: true,
    contentBase: './demo',
    host: '0.0.0.0',
    port: '8084'
};
baseConfig.devtool = 'cheap-module-eval-source-map';
baseConfig.mode = 'development';

module.exports = baseConfig;