var path = require('path');
module.exports = {
    entry: './apps/ticket/public/js/index.ts',
    output: {
        filename: '/bundle.js',
        path: '/'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                enforce: 'pre',
                test: /\.tsx?$/,
                use: "source-map-loader"
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            amorphic: path.resolve(__dirname, './node_modules/semotus/index.js')
        }
    },
    devtool: 'inline-source-map'
};