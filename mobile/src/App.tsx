import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './store/ToastContext';
import { Dashboard } from './pages/Dashboard';
import { AddEntry } from './pages/AddEntry';
import { Settings } from './pages/Settings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import ErrorBoundary from './components/ErrorBoundary';
import { Icon, IconName } from './components/Icons'; // Import IconName
import { RootStackParamList, TabParamList } from './types'; // Import the new types

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  const { t } = useApp();

  // Map route names to icon names for type safety
  const iconMapping: Record<keyof TabParamList, IconName> = {
    Home: 'home',
    Add: 'plusCircle',
    Settings: 'settings',
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName = iconMapping[route.name];
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Dashboard} 
        options={{ title: t.nav.home }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddEntry} 
        options={{ title: t.nav.add }}
      />
      <Tab.Screen 
        name="Settings" 
        component={Settings} 
        options={{ title: t.nav.settings }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ToastProvider> 
            <AppProvider>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="MainTabs" component={TabNavigator} />
                  <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                </Stack.Navigator>
              </NavigationContainer>
            </AppProvider>
          </ToastProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
