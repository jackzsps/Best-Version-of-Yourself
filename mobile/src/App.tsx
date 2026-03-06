import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './store/ToastContext';
import { Dashboard } from './pages/Dashboard';
import { AddEntry } from './pages/AddEntry';
import { Stats } from './pages/Stats';
import { Vote } from './pages/Vote';
import { Settings } from './pages/Settings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import ErrorBoundary from './components/ErrorBoundary';

// 🛑 FORCE DISABLE SCREENS TO VERIFY IF REACT-NATIVE-SCREENS IS THE CULPRIT
enableScreens(false);
import { Icon, IconName } from './components/Icons';
import { RootStackParamList, TabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const CustomTabSystem = () => {
  const [activeTab, setActiveTab] = useState<keyof TabParamList>('Home');
  const { t, theme } = useApp();
  const insets = useSafeAreaInsets();
  const isVintageTheme = theme === 'vintage';

  const iconMapping: Record<keyof TabParamList, IconName> = {
    Home: 'home',
    Stats: 'barChart',
    Add: 'plusCircle',
    Vote: 'star',
    Settings: 'settings',
  };

  const tabs: { key: keyof TabParamList; label: string; component: React.FC<any> }[] = [
    { key: 'Home', label: t.nav.home, component: Dashboard },
    { key: 'Stats', label: t.nav?.stats || 'Stats', component: Stats },
    { key: 'Add', label: '', component: AddEntry },
    { key: 'Vote', label: (t.nav as any)?.vote || '投票', component: Vote },
    { key: 'Settings', label: t.nav.settings, component: Settings },
  ];

  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component || Dashboard;

  return (
    <View style={{ flex: 1, backgroundColor: isVintageTheme ? '#F5E6D3' : 'white' }}>
      <View style={{ flex: 1 }}>
        <ActiveComponent setActiveTab={setActiveTab} />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: isVintageTheme ? '#E6D2B5' : 'white', paddingBottom: insets.bottom, borderTopWidth: 1, borderTopColor: isVintageTheme ? '#8B7355' : '#eee', paddingHorizontal: 10 }}>
        {tabs.map((tab) => {
          const isFocused = activeTab === tab.key;
          const iconName = iconMapping[tab.key];

          if (tab.key === 'Add') {
            return (
              <View key={tab.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                <TouchableOpacity
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    position: 'absolute',
                    top: -24,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: isVintageTheme ? '#2C241B' : '#111827',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 6,
                    borderWidth: 4,
                    borderColor: isVintageTheme ? '#F5E6D3' : '#FFFFFF',
                  }}
                  activeOpacity={0.8}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Icon name={iconName} size={30} color={isVintageTheme ? '#F5E6D3' : 'white'} />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}
              hitSlop={{ top: 15, bottom: 15, left: 20, right: 20 }}
            >
              <Icon
                name={iconName}
                size={24}
                color={isFocused ? (isVintageTheme ? '#2C241B' : '#000') : (isVintageTheme ? 'rgba(92, 64, 51, 0.5)' : 'gray')}
              />
              <Text style={{
                color: isFocused ? (isVintageTheme ? '#2C241B' : '#000') : (isVintageTheme ? 'rgba(92, 64, 51, 0.5)' : 'gray'),
                fontSize: 11,
                marginTop: 4,
                fontWeight: isFocused ? '600' : '500',
                fontFamily: isVintageTheme ? 'Courier' : undefined
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

console.log('🚀 [App.tsx] Module Loaded');

const App = () => {
  // Default metrics for safe area (iPhone 14/15 approx) - needed for New Architecture init failure prevention
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 50, left: 0, right: 0, bottom: 30 },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialMetrics} style={{ flex: 1 }}>
        <ErrorBoundary>
          <ToastProvider>
            <AppProvider>
              <View style={{ flex: 1, backgroundColor: 'white' }}>
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
