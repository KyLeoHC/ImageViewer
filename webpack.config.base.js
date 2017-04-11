const webpack = require('webpack');
let config = {
    entry: {
        imageViewer: './src/index'
    },
    module: {
        noParse: /es6-promise\.js$/,
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader'
                    }
                ]
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
                        loader: 'postcss-loader'
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: () => {
                    return [
                        require('autoprefixer')
                    ];
                },
                babel: {
                    presets: ['es2015'],
                    plugins: ['transform-runtime']
                }
            }
        })
    ]
};

module.exports = config;