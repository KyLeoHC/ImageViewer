const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const getVersion = () => {
    const json = JSON.parse(fs.readFileSync('./package.json').toString());
    return json.version;
};

const config = {
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
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: false,
                        minimize: true
                    }
                }
            },
            {
                test: /\.js$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                include: [path.resolve(__dirname, './src')],
                exclude: ['node_modules'],
                options: {
                    formatter: require('eslint-friendly-formatter')
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.styl/,
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
                        loader: 'stylus-loader',
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
            __VERSION__: JSON.stringify(getVersion())
        })
    ]
};

module.exports = config;