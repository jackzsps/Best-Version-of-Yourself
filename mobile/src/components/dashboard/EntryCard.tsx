import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
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

interface EntryCardProps {
  entry: Entry;
  onPress?: (entry: Entry) => void;
}

export const EntryCard = ({ entry, onPress }: EntryCardProps) => {
  const { theme, t } = useApp();
  const isVintage = theme === 'vintage';
  const usageStyle = getUsageStyles(entry.usage, theme);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress && onPress(entry)}
      style={isVintage ? styles.vintageContainer : styles.container}
    >
      {/* Image Section */}
      <View
        style={[
          styles.avatarContainer,
          isVintage && styles.vintageAvatarContainer,
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16, // Web p-4
    backgroundColor: '#ffffff',
    borderRadius: 12, // Web rounded-xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 12,
  },
  vintageContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9f5eb', // Web bg-vintage-card
    borderBottomWidth: 1, // Web border-b
    borderBottomColor: '#d4c5b0', // Web border-vintage-line
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    // Note: Web vintage list items don't have heavy shadows, just a clean border-b look
  },
  avatarContainer: {
    width: 48, // Web w-12
    height: 48, // Web h-12
    borderRadius: 24, // Web rounded-full
    marginRight: 16, // Web mr-4
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Web bg-gray-100
  },
  vintageAvatarContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2c241b', // Web border-vintage-ink
    borderStyle: 'solid',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderText: {
    fontSize: 20, // Web text-xl
    fontWeight: '700', // Web font-bold
    color: '#6B7280', // Web text-gray-500
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
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cost: {
    fontSize: 16,
    fontWeight: '700', // Web font-bold
    color: '#111827', // Web text-gray-900
  },
  vintageCost: {
    fontSize: 16,
    color: '#2c241b', // Web text-vintage-ink
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  calories: {
    fontSize: 12, // Web text-xs
    fontWeight: '500', // Web font-medium
    color: '#6B7280', // Web text-gray-500
    marginTop: 2,
  },
  vintageCalories: {
    fontSize: 12, // Web text-xs
    fontWeight: '500', // Web font-medium
    color: '#8b4513', // Web text-vintage-leather
    fontFamily: 'Courier',
    marginTop: 2,
  },
});
