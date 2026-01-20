// Placeholder for Dashboard screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EntryList } from '../components/dashboard/EntryList';
import { useApp } from '../store/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export const Dashboard = () => {
  const { entries, t } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.dashboard.title}</Text>
        <Text style={styles.subtitle}>{t.dashboard.subtitle}</Text>
      </View>
      <EntryList entries={entries} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
});
