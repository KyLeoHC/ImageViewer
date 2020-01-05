const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('./webpack.config.base');

baseConfig.entry = {
  imageViewer: './site/index.ts'
};
baseConfig.output = {
  path: path.resolve(__dirname, '/'),
  publicPath: '/',
  chunkFilename: '[name]/chunk.js',
  filename: '[name]/bundle.js'
};

baseConfig.plugins.push(
  new HtmlWebpackPlugin({
    filename: `site/index.html`,
    template: `./site/index.html`,
    chunks: ['imageViewer']
  })
);
baseConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

baseConfig.devServer = {
  hot: true,
  inline: true,
  // open: true,
  contentBase: './',
  host: '0.0.0.0',
  port: '8084'
};

baseConfig.devtool = 'cheap-module-eval-source-map';
baseConfig.mode = 'development';

module.exports = baseConfig;
