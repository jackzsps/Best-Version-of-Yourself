const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

// 1. 定義路徑：取得 mobile 資料夾與上一層的 shared 資料夾
const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../shared');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // 2. 告訴 Metro: "請把 shared 資料夾也納入監控範圍"
  watchFolders: [sharedRoot],

  resolver: {
    // 3. 避免 React 版本衝突的重要設定
    // 讓 shared 資料夾內的程式碼在尋找 node_modules 時，強制指回 mobile 的 node_modules
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => path.join(process.cwd(), 'node_modules', name),
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);