const path = require('path');
const baseConfig = require('./webpack.config.base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

process.env.BABEL_MODULE = 'es';

baseConfig.entry = {
  'imageViewer': ['./src/index.ts', './src/style/index.ts']
};
baseConfig.output = {
  path: path.resolve(__dirname, '../dist'),
  filename: 'imageViewer.min.js',
  library: 'ImageViewer',
  libraryTarget: 'umd'
};

baseConfig.plugins = baseConfig.plugins.concat([
  new OptimizeCSSAssetsPlugin({}),
  new MiniCssExtractPlugin({
    filename: 'imageViewer.min.css'
  })
]);

baseConfig.mode = 'production';

module.exports = baseConfig;
