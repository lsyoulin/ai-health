/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'
import path from 'path'

type WebpackChainFn = (chain: any) => void

const sharedPath = path.resolve(__dirname, '..', '..', 'shared')

const sharedWebpackChain: WebpackChainFn = (chain) => {
  chain.resolve.alias.set('@shared', sharedPath)
  chain.module
    .rule('shared-ts')
    .test(/shared[\\/].*\.(ts|tsx|js|jsx)$/)
    .use('babel-loader')
    .loader(require.resolve('babel-loader'))
    .options({
      presets: [
        ['taro', { framework: 'react', ts: true, compiler: 'webpack5' }]
      ]
    })
}

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'zhishi-mobile',
    date: '2026-7-14',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {}
    },
    framework: 'react',
    compiler: 'webpack5',
    cache: {
      enable: false
    },
    sass: {
      resource: ['src/styles/variables.scss']
    },
    alias: {
      '@shared': sharedPath
    },
    mini: {
      webpackChain: sharedWebpackChain,
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      webpackChain: sharedWebpackChain,
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    rn: {
      appName: 'zhishi',
      postcss: {
        cssModules: {
          enable: false
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
