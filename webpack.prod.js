const path = require('path');
require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    // Entry point of your application
    entry: './src/index.tsx',

    // Output configuration
    // output: {
    //     path: path.resolve(__dirname, 'public'),
    //     filename: 'bundle.js',
    //     publicPath: '/', // Ensures correct routing for React Router
    // },

    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        publicPath: '/',
    },

    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
                styles: {
                    name: 'styles',
                    test: /\.css$/,
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
        runtimeChunk: {
            name: 'runtime',
        },
    },

    performance: {
        hints: 'warning', // Изменяем с 'error' на 'warning'
        maxAssetSize: 500 * 1024, // Увеличиваем лимит до 500 KiB
        maxEntrypointSize: 500 * 1024
    },

    // Development server configuration
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 8080,
        hot: true, // Enable Hot Module Replacement (HMR)
        historyApiFallback: true, // Required for React Router
    },

    // Module rules for handling different file types
    module: {
        rules: [
            // TypeScript and JavaScript files
            {
                test: /\.(ts|tsx|js|jsx|d\.ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react',
                            '@babel/preset-typescript',
                        ],
                    },
                },
            },
            // CSS files
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: ["@tailwindcss/postcss"],
                        }
                    }
                }],
            },
        ],
    },

    // Resolve file extensions
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },

    // Plugins
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html', // Path to your HTML template
        }),
        new MiniCssExtractPlugin(),
    ],

    // Mode (development or production)
    mode: 'production',
};