const path = require('path');
const webpack = require('webpack');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const packageJson = require('../package.json');
const devMode = process.env.NODE_ENV === 'development';

const baseConfig = {
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [
          path.resolve(__dirname, './src'),
          path.resolve(__dirname, './site')
        ],
        exclude: [/node_modules/],
        options: {
          formatter: require('eslint-formatter-friendly')
        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.less/,
        use: [
          {
            loader: devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            options: {
              sourceMap: false
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: false
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: false,
              plugins: () => [
                require('autoprefixer')()
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: false
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(packageJson.version)
    })
  ],
  stats: {
    children: false,
    chunkModules: false,
    entrypoints: false,
    modules: false,
    // Display bailout reasons
    optimizationBailout: true
  }
};

const fileSuffix = '{html,css,less}';
baseConfig.plugins.push(
  new StyleLintPlugin({
    files: [
      `site/**/*.${fileSuffix}`,
      `src/**/*.${fileSuffix}`,
    ]
  })
);

module.exports = baseConfig;
