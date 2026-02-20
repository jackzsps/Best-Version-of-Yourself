/**
 * @format
 */

// 👇 1. 這一行必須加在最上面
import 'react-native-gesture-handler';

// 👇 2. 引入 React
import React from 'react';
import { AppRegistry, DeviceEventEmitter, LogBox } from 'react-native';

// 忽略 Deep Import 警告，因為這是修正 New Architecture 崩潰的必要手段
LogBox.ignoreLogs(['Deep imports from']);

// 隱藏 Firebase v22 Modular API 升級的廢棄警告 (目前我們依舊使用熟悉的 namespaced API)
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// 👇👇👇 [Runtime Fix] 手動註冊 RCTEventEmitter
// 某些原生模組 (如 react-native-gesture-handler) 在 New Architecture 下仍會嘗試呼叫舊版 Bridge 的事件
// 使用內部 registerCallableModule 以同時支援 Bridge 與 Bridgeless 模式
const registerCallableModule = require('react-native/Libraries/Core/registerCallableModule');

const RCTEventEmitter = {
  receiveEvent: (tag, eventName, body) => {
    DeviceEventEmitter.emit(eventName, body);
  },
  receiveTouches: (eventTopLevelType, touches, changedIndices) => {
    // console.log('RCTEventEmitter.receiveTouches', eventTopLevelType);
  }
};

registerCallableModule.default('RCTEventEmitter', RCTEventEmitter);
console.log('🔧 [Patch] RCTEventEmitter registered via registerCallableModule.');
// 👆👆👆 [Runtime Fix] 結束

import App from './src/App';
import { name as appName } from './app.json';

// 👇👇👇 [VC 偵探模式] 開始鑑識 👇👇👇
console.log('🚀 [index.js] JS Bundle 開始執行！(JS Bundle Started)');

try {
  console.log('🕵️‍♂️ [鑑識報告] React 版本:', React.version);
} catch (e) {
  console.error('💥 [鑑識報告] 嚴重錯誤：檢查 React 時發生異常', e);
}

console.log(`✅ [index.js] 準備註冊 App: ${appName}`);
// 👆👆👆 [VC 偵探模式] 結束鑑識 👆👆👆

AppRegistry.registerComponent(appName, () => App);
