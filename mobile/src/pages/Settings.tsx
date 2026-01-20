// Placeholder for Settings screen
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useApp } from '../store/AppContext';

export const Settings = () => {
  const { t, logout, user } = useApp();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.settings.title}</Text>
      {user && <Text style={styles.userInfo}>Logged in as: {user.email}</Text>}
      <Button title={t.settings.signOut} onPress={logout} color="#FF3B30" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 20,
  },
});
