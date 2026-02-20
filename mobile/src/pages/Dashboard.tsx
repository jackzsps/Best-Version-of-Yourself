// Placeholder for Dashboard screen
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EntryList } from '../components/dashboard/EntryList';
import { useApp } from '../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthModal } from '../components/AuthModal';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const Dashboard = () => {
  const { entries, t, user, theme } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isVintage = theme === 'vintage';
  const insets = useSafeAreaInsets();

  const greeting = getGreeting();
  // Optional: Add stats
  const totalEntries = entries.length;

  const DashboardHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, isVintage && styles.vintageGreeting]}>
            {greeting}, {user?.displayName?.split(' ')[0] || 'Friend'}
          </Text>
          <Text style={[styles.subtitle, isVintage && styles.vintageSubtitle]}>
            {t.dashboard.subtitle || "Ready to record today's journey?"}
          </Text>
        </View>
        {!user && (
          <TouchableOpacity
            style={[styles.loginBtn, isVintage && styles.vintageLoginBtn]}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={[styles.loginBtnText, isVintage && styles.vintageLoginBtnText]}>
              {t.settings?.signIn || "Sign In"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, isVintage && styles.vintageStatCard]}>
          <Text style={[styles.statValue, isVintage && styles.vintageStatValue]}>{totalEntries}</Text>
          <Text style={[styles.statLabel, isVintage && styles.vintageStatLabel]}>Total Entries</Text>
        </View>
        <View style={[styles.statCard, isVintage && styles.vintageStatCard]}>
          <Text style={[styles.statValue, isVintage && styles.vintageStatValue]}>🔥</Text>
          <Text style={[styles.statLabel, isVintage && styles.vintageStatLabel]}>Build your streak</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, isVintage && styles.vintageSectionTitle]}>
        Recent Entries
      </Text>
    </View>
  ), [user, isVintage, greeting, totalEntries, t]);

  console.log('📊 [Dashboard] Rendering... Mode:', isVintage ? 'Vintage' : 'Default');

  return (
    <View style={[
      isVintage ? styles.vintageContainer : styles.container,
      { paddingTop: insets.top }
    ]}>
      <EntryList
        entries={entries}
        ListHeaderComponent={DashboardHeader}
      />
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // softer, more modern white-gray
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#F5F0E6', // warmer, authentic paper tone
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  vintageGreeting: {
    fontFamily: 'Courier',
    color: '#2d2a26',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  vintageSubtitle: {
    fontFamily: 'Courier',
    color: '#57534e',
  },
  loginBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vintageLoginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2d2a26',
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  vintageLoginBtnText: {
    color: '#2d2a26',
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  vintageStatCard: {
    backgroundColor: '#fdfbf7',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6', // energetic blue
    marginBottom: 4,
  },
  vintageStatValue: {
    color: '#b91c1c', // stamp red
    fontFamily: 'Courier',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vintageStatLabel: {
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  vintageSectionTitle: {
    fontFamily: 'Courier',
    color: '#2d2a26',
    textDecorationLine: 'underline',
  }
});
