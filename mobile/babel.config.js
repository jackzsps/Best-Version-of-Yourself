const path = require('path'); // 記得引入 path

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          // 💡 改用絕對路徑，確保 Babel 100% 找得到
          '@shared': path.resolve(__dirname, '../shared'),
        },
      },
    ],
    // 💡 [修正] 移除重複的 Worklets 插件，Reanimated 插件已包含此功能
    // 'react-native-worklets/plugin',
    // 如果你有用 Reanimated，這個必須放在最後
    'react-native-reanimated/plugin',
  ],
};