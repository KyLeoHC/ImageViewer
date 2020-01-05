const path = require('path');
const baseConfig = require('./webpack.config.base');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const InlineSourceWebpackPlugin = require('inline-source-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

baseConfig.output = {
  path: path.resolve(__dirname, '../dist_site'),
  publicPath: '',
  filename: '[name]/bundle.[contenthash].js',
  chunkFilename: '[name]/chunk.[contenthash].js'
};

baseConfig.optimization = {
  chunkIds: 'size',
  moduleIds: 'hashed',
  runtimeChunk: 'single',
  splitChunks: {
    name: true,
    chunks: 'initial',
    cacheGroups: {
      vendor: {
        name: 'vendor',
        chunks: 'all',
        enforce: true,
        test: /[\\/]node_modules[\\/]/
      }
    }
  }
};

baseConfig.plugins.push(
  new HtmlWebpackPlugin({
    filename: `index.html`,
    template: `./site/index.html`,
    chunksSortMode: 'dependency',
    chunks: ['runtime', 'vendor', 'site'],
    inject: true,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true
      // more options:
      // https://github.com/kangax/html-minifier#options-quick-reference
    }
  })
);

baseConfig.plugins = baseConfig.plugins.concat([
  new InlineSourceWebpackPlugin({
    // more options:
    // https://github.com/KyLeoHC/inline-source-webpack-plugin
    compress: true,
    rootpath: './site'
  }),
  new OptimizeCSSAssetsPlugin({}),
  new MiniCssExtractPlugin({
    filename: '[name]/bundle.[contenthash].css',
    chunkFilename: '[name]/chunk.[contenthash].css'
  })
]);

baseConfig.plugins.push(new CopyWebpackPlugin([{
  from: path.resolve(__dirname, '../static'),
  to: 'static',
  ignore: ['.*']
}]));
baseConfig.mode = 'production';

module.exports = baseConfig;
