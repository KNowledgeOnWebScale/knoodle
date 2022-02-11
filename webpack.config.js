const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const path = require('path');

module.exports = {
    mode: "production",
    entry: path.resolve(__dirname, './js/index.js'),
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname),
    },
    target: ['web', 'es5'],
    plugins: [
        new NodePolyfillPlugin()
    ]
};
