/**
 * @format
 */

// 👇 1. 這一行必須加在最上面，這是解決 Release 版閃退的關鍵
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);