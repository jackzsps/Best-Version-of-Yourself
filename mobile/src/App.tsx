import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './store/AppContext';
import { Dashboard } from './pages/Dashboard';
import { AddEntry } from './pages/AddEntry';
import { Settings } from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { Icon } from './components/Icons';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <NavigationContainer>
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
                  return (
                    <Icon name={iconName as any} size={size} color={color} />
                  );
                },
                tabBarActiveTintColor: '#000',
                tabBarInactiveTintColor: 'gray',
              })}
            >
              <Tab.Screen name="Home" component={Dashboard} />
              <Tab.Screen name="Add" component={AddEntry} />
              <Tab.Screen name="Settings" component={Settings} />
            </Tab.Navigator>
          </NavigationContainer>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
