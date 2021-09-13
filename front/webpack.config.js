const webpack = require('webpack');
const path = require('path');

const config = {
  entry: {
    index: { import: path.join(__dirname, 'index.js') }
  },
  output: {
    path: path.join(__dirname),
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'nosources-source-map',
  optimization: {
    minimize: true
  }
};

module.exports = config;
