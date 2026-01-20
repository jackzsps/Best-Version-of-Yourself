import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native'; // Native components
import { Entry } from '../../types';
import { EntryCard } from './EntryCard';
import { useApp } from '../../store/AppContext';

// ✅ React Native Optimized List
export const EntryList = ({ entries }: { entries: Entry[] }) => {
  const { t } = useApp();

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t.dashboard.noEntries}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      initialNumToRender={10} // Only render 10 initially for fast startup
      windowSize={5} // Reduce memory usage
      removeClippedSubviews={true} // Unmount components off-screen
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <EntryCard
          entry={item}
          // If you added isSyncing to your Entry type:
          // status={item.isSyncing ? t.syncing : undefined}
        />
      )}
      // Optional: Add ItemSeparatorComponent for consistent spacing
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for floating action button
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
