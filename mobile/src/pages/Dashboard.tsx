// Placeholder for Dashboard screen
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EntryList } from '../components/dashboard/EntryList';
import { InsightCard } from '../components/dashboard/InsightCard';
import { EditEntryModal } from '../components/dashboard/EditEntryModal';
import { useApp } from '../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthModal } from '../components/AuthModal';
import { Entry } from '@shared/types';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const Dashboard = () => {
  const { entries, t, user, theme, language, updateEntry, deleteEntry } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const isVintage = theme === 'vintage';
  const insets = useSafeAreaInsets();

  // Calculate today's cost and calories
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStartSeconds = Math.floor(today.getTime() / 1000);

  const todayEntries = entries.filter(e => {
    // Handle both Firestore Timestamp obj and raw seconds number
    const entrySeconds = (e.date as any)?.seconds ?? e.date;
    return entrySeconds >= todayStartSeconds;
  });

  const todayCost = todayEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  const todayCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

  const greeting = getGreeting();
  // Optional: Add stats
  // totalEntries removed as per instruction

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
          <Text style={[styles.statLabel, isVintage && styles.vintageStatLabel]}>
            {t.dashboard.spent}
          </Text>
          <Text style={[styles.statValue, isVintage && styles.vintageStatValue]}>
            {t.dashboard.unitCurrency}{todayCost.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statCard, isVintage && styles.vintageStatCard]}>
          <Text style={[styles.statLabel, isVintage && styles.vintageStatLabel]}>
            {t.dashboard.calories}
          </Text>
          <Text style={[styles.statValue, isVintage && styles.vintageStatValue]}>
            {todayCalories.toLocaleString()} <Text style={{ fontSize: 14, fontWeight: '500' }}>{t.dashboard.unitCal}</Text>
          </Text>
        </View>
      </View>

      <InsightCard
        t={t}
        theme={theme}
        insightText={t.dashboard.insights?.generalTip || "Small habits lead to big changes."}
      />

      <Text style={[styles.sectionTitle, isVintage && styles.vintageSectionTitle]}>
        Recent Entries
      </Text>
    </View>
  ), [user, isVintage, greeting, todayCost, todayCalories, t]);

  console.log('📊 [Dashboard] Rendering... Mode:', isVintage ? 'Vintage' : 'Default');

  const handleSaveEntry = (updatedEntry: Entry) => {
    updateEntry(updatedEntry);
    setSelectedEntry(null);
  };

  const handleDeleteEntry = (entryToDelete: Entry) => {
    deleteEntry(entryToDelete);
    setSelectedEntry(null);
  };

  return (
    <View style={[
      isVintage ? styles.vintageContainer : styles.container,
      { paddingTop: insets.top }
    ]}>
      <EntryList
        entries={entries}
        ListHeaderComponent={DashboardHeader}
        onEntryPress={(entry) => setSelectedEntry(entry)}
      />
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <EditEntryModal
        visible={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        theme={theme}
        language={language}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8', // Web Pastel BG
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#f0e6d2', // Web Vintage Aged Paper BG
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
    marginBottom: 24, // Matches React Web spacing closely
    gap: 16, // Web uses gap-4 which is 16px
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24, // Bento-style (1.5rem / 24px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, // shadow-soft approximation
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 3,
    alignItems: 'flex-start', // Web left-aligns stats
  },
  vintageStatCard: {
    backgroundColor: '#f9f5eb', // Lighter vintage paper from Tailwind
    borderWidth: 2,
    borderColor: '#2c241b', // Vintage Ink
    borderRadius: 16, // Softer vintage curve
    shadowColor: '#2c241b',
    shadowOffset: { width: 3, height: 3 }, // Web css 3px 3px 0px solid
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900', // font-black equivalent
    color: '#111827', // text-gray-900
    marginTop: 4,
  },
  vintageStatValue: {
    color: '#2c241b', // vintage-ink
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700', // Web font-bold
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  vintageStatLabel: {
    color: '#8b4513', // vintage-leather
    fontFamily: 'Courier',
    fontWeight: 'bold',
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
  },
});
