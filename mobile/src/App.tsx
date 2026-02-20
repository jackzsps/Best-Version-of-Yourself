import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './store/ToastContext';
import { Dashboard } from './pages/Dashboard';
import { AddEntry } from './pages/AddEntry';
import { Settings } from './pages/Settings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import ErrorBoundary from './components/ErrorBoundary';
import { Icon, IconName } from './components/Icons';
import { RootStackParamList, TabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const CustomTabSystem = () => {
  const [activeTab, setActiveTab] = useState<keyof TabParamList>('Home');
  const { t } = useApp();
  const insets = useSafeAreaInsets();

  const iconMapping: Record<keyof TabParamList, IconName> = {
    Home: 'home',
    Add: 'plusCircle',
    Settings: 'settings',
  };

  const tabs: { key: keyof TabParamList; label: string; component: React.FC }[] = [
    { key: 'Home', label: t.nav.home, component: Dashboard },
    { key: 'Add', label: t.nav.add, component: AddEntry },
    { key: 'Settings', label: t.nav.settings, component: Settings },
  ];

  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component || Dashboard;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        <ActiveComponent />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: 'white', paddingBottom: insets.bottom, borderTopWidth: 1, borderTopColor: '#eee' }}>
        {tabs.map((tab) => {
          const isFocused = activeTab === tab.key;
          const iconName = iconMapping[tab.key];

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}
            >
              <Icon name={iconName} size={24} color={isFocused ? '#000' : 'gray'} />
              <Text style={{ color: isFocused ? '#000' : 'gray', fontSize: 12, marginTop: 4 }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

import { enableScreens } from 'react-native-screens';

// 啟用 react-native-screens 原生優化 (New Architecture 建議顯式呼叫)
// enableScreens(true);

console.log('🚀 [App.tsx] Module Loaded');

const App = () => {
  // Default metrics for safe area (iPhone 14/15 approx) - needed for New Architecture init failure prevention
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 50, left: 0, right: 0, bottom: 30 },
  };

  // Ensure the default theme has a background color so it's not transparent/black if layout collapses
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'yellow', // Debug yellow
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialMetrics} style={{ flex: 1 }}>
        <ErrorBoundary>
          <ToastProvider>
            <AppProvider>
              <View style={{ flex: 1 }}>
                <CustomTabSystem />
              </View>
            </AppProvider>
          </ToastProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
