const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const path = require('path');

module.exports = {
    mode: "production",
    entry: {
        index: path.resolve(__dirname, './js/index.js'),
        faq: path.resolve(__dirname, './js/faq.js')
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname),
    },
    target: ['web', 'es5'],
    plugins: [
        new NodePolyfillPlugin()
    ]
};
