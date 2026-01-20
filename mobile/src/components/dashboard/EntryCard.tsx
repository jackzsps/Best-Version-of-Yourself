// Placeholder for EntryCard component
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Entry } from '../types';
import { useApp } from '../../store/AppContext';

export const EntryCard = ({ entry }: { entry: Entry }) => {
  const { theme } = useApp();
  const isVintage = theme === 'vintage';

  return (
    <View style={isVintage ? styles.vintageContainer : styles.container}>
      <View style={styles.imageContainer}>
        {entry.imageUrl ? (
          <Image source={{ uri: entry.imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>
            {entry.itemName ? entry.itemName[0].toUpperCase() : '?'}
          </Text>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={isVintage ? styles.vintageTitle : styles.title}>
          {entry.itemName}
        </Text>
        <Text style={styles.subtitle}>{entry.usage}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={isVintage ? styles.vintageCost : styles.cost}>
          ${entry.cost}
        </Text>
        <Text style={styles.calories}>{entry.calories} kcal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vintageContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fdfbf7', // vintage-card color approximation
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  vintageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d2a26', // vintage-ink
    fontFamily: 'Courier', // Example typewriter font
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  vintageCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
  calories: {
    fontSize: 12,
    color: '#6b7280',
  },
});
