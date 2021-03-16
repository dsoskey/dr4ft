const path = require("path");
const webpack = require("webpack");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    polyfill: "@babel/polyfill",
    app: "./frontend/src/init.ts"
  },
  output: {
    path: path.join(__dirname, "./built/frontend"),
    filename: "[name]-[hash].js",
    publicPath: "/"
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      template: "./frontend/index.html.tpl",
      cache: false
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "frontend",
          globOptions: {
            ignore: ["*.tpl", "src/**/*", "test/**/*", "**/*.spec.*"]
          }
        }
      ]
    }),
    new webpack.DefinePlugin({
      BUILD_DATE: JSON.stringify(new Date().toISOString().slice(0, 10))
    })
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx", ".css", ".less"],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      maxSize: 200000
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: [
          /node_modules/,
          /\.spec\.(ts|mts)$/,
          /backend/,
        ],
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'fsconfig.json',
          }
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: [
          /node_modules/,
          /\.spec\.(js|mjs)$/
        ],
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          {
            loader: "resolve-url-loader",
            options: {
            }
          }, {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            }
          }
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        loader: "url-loader"
      }
    ]
  }
};
