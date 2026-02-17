/**
 * @format
 */

// 👇 1. 這一行必須加在最上面，這是解決 Release 版閃退的關鍵
import 'react-native-gesture-handler';

// 👇 2. 引入 React (為了檢查版本)
import React from 'react';

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// 👇👇👇 [VC 偵探模式] 開始鑑識 👇👇👇
// 1. 如果你在 Console 沒看到這行，代表 JS 在更早之前(例如 import 階段)就掛了 (兇手三)
console.log('🚀 [index.js] JS Bundle 開始執行！(JS Bundle Started)');

try {
  // 2. 檢查 React 版本
  console.log('🕵️‍♂️ [鑑識報告] React 版本:', React.version);
  
  // 3. 嘗試取得 React 的真實路徑 (檢查是否有多重實例)
  // 注意：在 Release 模式下這行可能會報錯或被優化，所以包在 try-catch 裡
  try {
    const reactPath = require.resolve('react');
    console.log('🕵️‍♂️ [鑑識報告] React 真實路徑:', reactPath);
  } catch (pathError) {
    console.log('⚠️ [鑑識報告] 無法解析路徑 (這是正常的，只要不是報錯就好)');
  }

} catch (e) {
  console.error('💥 [鑑識報告] 嚴重錯誤：檢查 React 時發生異常', e);
}

console.log(`✅ [index.js] 準備註冊 App: ${appName}`);
// 👆👆👆 [VC 偵探模式] 結束鑑識 👆👆👆

AppRegistry.registerComponent(appName, () => App);