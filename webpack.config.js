const path = require("path");
const htmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "src/index.js"),
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "neat.js",
        library: "Neat",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.png$/,
                loader: ["url-loader?mimetype=image/png"],
            },
        ],
    },
    resolve: {
        alias: {
            Styles: path.resolve(__dirname, "public/css/"),
            Images: path.resolve(__dirname, "public/img/"),
        },
    },
    plugins: [
        new htmlWebpackPlugin({
            template: path.resolve(__dirname, "index.html"),
            hash: true,
        }),
    ],
};
