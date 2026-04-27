const path = require('path')

const config = {
  projectName: 'JobLoop',
  date: '2026-04-22',
  designWidth: 375,
  deviceRatio: { '375': '1', '667': '2' },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  plugins: ['@tarojs/plugin-framework-react', '@tarojs/plugin-platform-weapp'],
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  copy: {
    patterns: [
      { from: path.resolve(__dirname, '..', 'src', 'assets'), to: path.resolve(__dirname, '..', 'dist', 'assets') },
    ],
    options: {},
  },
}

module.exports = function(merge) {
  return merge({}, config, require.resolve('./weapp'))
}
