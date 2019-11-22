const path = require('path');
const baseConfig = require('./webpack.config.base');

baseConfig.output = {
  path: path.resolve(__dirname, 'build'),
  publicPath: '/build/',
  filename: '[name].js',
  library: 'ImageViewer',
  libraryExport: 'default',
  libraryTarget: 'umd'
};
baseConfig.devServer = {
  hot: false,
  inline: true,
  // open: true,
  contentBase: './demo',
  host: '0.0.0.0',
  port: '8084'
};
baseConfig.devtool = 'cheap-module-eval-source-map';
baseConfig.mode = 'development';

module.exports = baseConfig;