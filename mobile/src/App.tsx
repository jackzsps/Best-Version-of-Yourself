import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './store/AppContext';
import { Dashboard } from './pages/Dashboard';
import { AddEntry } from './pages/AddEntry';
import { Settings } from './pages/Settings';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import ErrorBoundary from './components/ErrorBoundary';
import { Icon } from './components/Icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  const { t } = useApp();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Add') {
            iconName = 'plusCircle';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          return <Icon name={iconName as any} size={size} color={color} />;
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
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
