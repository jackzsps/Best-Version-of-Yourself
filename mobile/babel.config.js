module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          // 告訴 Babel: @shared 代表上一層的 shared 資料夾
          '@shared': '../shared',
        },
      },
    ],
    // 如果你有用 Reanimated，這個必須放在最後
    'react-native-reanimated/plugin',
  ],
};