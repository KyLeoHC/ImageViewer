var webpack = require('webpack');
var path = require('path');
var config = {
    entry: {
        imageViewer: './src/index'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        publicPath: '/build/',
        filename: '[name].js'
    },
    module: {
        noParse: /es6-promise\.js$/,
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel'
            },
            {test: /\.css$/, loader: 'style-loader!css-loader'}
        ]
    },
    babel: {
        presets: ['es2015'],
        plugins: ['transform-runtime']
    },
    plugins: [],
    devServer: {
        contentBase: './demo',
        host: '0.0.0.0',
        port: '8084'
    }
};

module.exports = config;