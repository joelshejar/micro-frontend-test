import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import RefreshPlugin from '@rspack/plugin-react-refresh';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  entry: {
    main: './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: 'auto',
    uniqueName: 'host',
  },
  experiments: {
    css: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        type: 'css',
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      title: 'Micro-Frontend Host',
    }),
    new rspack.container.ModuleFederationPlugin({
      name: 'host',
      remotes: {
        // In development: use localhost
        // In production: placeholder will be replaced by edge function with KV value
        remote1: isDev
          ? 'remote1@http://localhost:3001/remoteEntry.js'
          : 'remote1@__REMOTE_URL_PLACEHOLDER__',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1',
          eager:true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
          eager:true,
        },
      },
    }),
    isDev && new RefreshPlugin(),
  ].filter(Boolean),
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  optimization: {
    minimize: !isDev,
    splitChunks: {
      chunks: 'all',
    },
  },
});
