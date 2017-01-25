var config = {
    entry: {
        imageViewer: './src/index'
    },
    module: {
        noParse: /es6-promise\.js$/,
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel'
            },
            {test: /\.css$/, loader: 'style-loader!css-loader!postcss-loader'}
        ]
    },
    babel: {
        presets: ['es2015'],
        plugins: ['transform-runtime']
    },
    plugins: [],
    postcss: () => {
        return [
            require('autoprefixer')
        ];
    }
};

module.exports = config;