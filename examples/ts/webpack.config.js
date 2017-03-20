// For instructions about this file refer to
// webpack and webpack-hot-middleware documentation
const webpack = require('webpack');
const path = require('path');
const context = [__dirname];

module.exports = {
    devtool: 'source-map',
    context: path.join.apply(null, context),
    entry: [
        './index.ts'
    ],
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    plugins: [],
    resolve: {
        extensions: ['.ts', '.tsx', '.jsx', '.js', '.json']
    },
    module: {
        loaders: [
            {
                test: /\.[tj]sx?$/,
                exclude: /node_modules/,
                loaders: ['awesome-typescript-loader']
            },
            {
                test: /\.json$/,
                loader: 'json'
            },
            {
                test: /\.html$/,
                loader: 'raw-loader'
            }
        ]
    }
};
