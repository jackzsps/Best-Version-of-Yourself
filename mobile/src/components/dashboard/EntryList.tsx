import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native'; // Native components
import { Entry } from '../../types';
import { EntryCard } from './EntryCard';
import { useApp } from '../../store/AppContext';

// ✅ React Native Optimized List
export const EntryList = ({
  entries,
  ListHeaderComponent,
  onEntryPress
}: {
  entries: Entry[],
  ListHeaderComponent?: React.ReactElement,
  onEntryPress?: (entry: Entry) => void
}) => {
  const { t } = useApp();

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t.dashboard.noEntries || "No entries yet. Start recording your journey!"}</Text>
    </View>
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      initialNumToRender={10} // Only render 10 initially for fast startup
      windowSize={5} // Reduce memory usage
      removeClippedSubviews={true} // Unmount components off-screen
      contentContainerStyle={[styles.listContainer, entries.length === 0 && { flexGrow: 1 }]}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty}
      renderItem={({ item }) => (
        <EntryCard
          entry={item}
          onPress={onEntryPress}
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
