import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Entry, UsageCategory, Theme } from '../../types';
import { useApp } from '../../store/AppContext';

// Helper to format date
const formatDate = (
  dateObj: { seconds: number; nanoseconds: number } | undefined,
  locale: string = 'en-US',
) => {
  if (!dateObj || typeof dateObj.seconds !== 'number') {
    return 'Invalid Date';
  }
  return new Date(dateObj.seconds * 1000).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
};

const getUsageStyles = (usage: UsageCategory, theme: Theme) => {
  const isVintage = theme === 'vintage';

  if (isVintage) {
    switch (usage) {
      case 'must':
        return { color: '#b91c1c', borderColor: '#b91c1c' }; // Red-ish stamp
      case 'need':
        return { color: '#2d2a26', borderColor: '#2d2a26' }; // Ink
      case 'want':
        return { color: '#92400e', borderColor: '#92400e' }; // Amber
      default:
        return { color: '#6b7280', borderColor: '#6b7280' };
    }
  }

  // Modern Bento Theme
  switch (usage) {
    case 'must':
      return { backgroundColor: '#FFE4E6', color: '#E11D48' };
    case 'need':
      return { backgroundColor: '#D1FAE5', color: '#059669' };
    case 'want':
      return { backgroundColor: '#EDE9FE', color: '#7C3AED' };
    default:
      return { backgroundColor: '#F3F4F6', color: '#6B7280' };
  }
};

export const EntryCard = ({ entry }: { entry: Entry }) => {
  const { theme, t } = useApp();
  const isVintage = theme === 'vintage';
  const usageStyle = getUsageStyles(entry.usage, theme);

  return (
    <View style={isVintage ? styles.vintageContainer : styles.container}>
      {/* Image Section */}
      <View
        style={[
          styles.imageContainer,
          isVintage && styles.vintageImageContainer,
        ]}
      >
        {entry.imageUrl ? (
          <Image source={{ uri: entry.imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>
            {entry.itemName ? entry.itemName[0].toUpperCase() : '?'}
          </Text>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text
          numberOfLines={1}
          style={isVintage ? styles.vintageTitle : styles.title}
        >
          {entry.itemName}
        </Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.badge,
              isVintage
                ? {
                    borderWidth: 1,
                    borderColor: usageStyle.borderColor,
                    backgroundColor: 'transparent',
                    paddingVertical: 0,
                  }
                : { backgroundColor: usageStyle.backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: usageStyle.color },
                isVintage && { fontWeight: 'bold' },
              ]}
            >
              {t.usage[entry.usage]}
            </Text>
          </View>

          <Text style={isVintage ? styles.vintageDate : styles.date}>
            {formatDate(entry.date)}
          </Text>
        </View>
      </View>

      {/* Right Section (Value) */}
      <View style={styles.rightContainer}>
        {(entry.type === 'expense' || entry.type === 'combined') && (
          <Text style={isVintage ? styles.vintageCost : styles.cost}>
            {t.dashboard.unitCurrency}
            {entry.cost}
          </Text>
        )}
        {(entry.type === 'diet' || entry.type === 'combined') && (
          <Text style={isVintage ? styles.vintageCalories : styles.calories}>
            {entry.calories} {t.dashboard.unitCal}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16, // More rounded for modern look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  vintageContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fdfbf7',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db', // vintage-line
    alignItems: 'center',
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // Circle
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  vintageImageContainer: {
    borderRadius: 0, // Square for vintage? Or keep circle with border
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2d2a26', // vintage-ink
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  vintageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2a26',
    fontFamily: 'Courier', // If available, otherwise falls back
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  vintageDate: {
    fontSize: 12,
    color: '#92400e', // leather
    fontStyle: 'italic',
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  vintageCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
  calories: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  vintageCalories: {
    fontSize: 12,
    color: '#92400e', // leather
    marginTop: 2,
  },
});
