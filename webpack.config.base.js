const webpack = require('webpack');
let config = {
    entry: {
        imageViewer: './src/index'
    },
    resolve: {
        extensions: ['.js']
    },
    module: {
        noParse: /es6-promise\.js$/,
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [
                                require('autoprefixer')()
                            ]
                        }
                    }
                ]
            }
        ]
    },
    plugins: []
};

module.exports = config;