const path = require('path');
const baseConfig = require('./webpack.config.base');

const umdConfig = Object.assign({
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js',
    library: 'ImageViewer',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  mode: 'production'
}, baseConfig);

const commonConfig = Object.assign({
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].common.js',
    library: 'ImageViewer',
    libraryExport: 'default',
    libraryTarget: 'commonjs2'
  },
  mode: 'production'
}, baseConfig);

module.exports = [umdConfig, commonConfig];