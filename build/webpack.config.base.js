const path = require('path');
const webpack = require('webpack');
const packageJson = require('../package.json');

const baseConfig = {
  entry: {
    imageViewer: './src/index.ts'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.resolve(__dirname, './src')],
        exclude: ['node_modules'],
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
            loader: 'style-loader',
            options: {
              sourceMap: false
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              minimize: true
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
  ]
};

module.exports = baseConfig;
