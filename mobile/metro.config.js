const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

// 1. 定義路徑
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // 2. 修正：只監聽真正存在的 shared 資料夾
  // (移除了原本導致崩潰的 node_modules 設定)
  watchFolders: [
    path.resolve(workspaceRoot, 'shared')
  ],

  resolver: {
    // 3. 設定 node_modules 搜尋路徑
    // 只找 mobile 裡面的 node_modules
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules')
    ],

    // 4. 防止 React 版本衝突
    extraNodeModules: {
      'react': path.resolve(projectRoot, 'node_modules/react'),
      'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    },
    
    // 5. 支援副檔名
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx'],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);