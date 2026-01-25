import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../store/AppContext';
import { Icon } from '../components/Icons';
import { PaywallModal } from '../components/PaywallModal';

export const Settings = () => {
  const navigation = useNavigation();
  const {
    t,
    logout,
    user,
    language,
    setLanguage,
    theme,
    setTheme,
    mode,
    setMode,
    subscription
  } = useApp();
  const isVintage = theme === 'vintage';
  const [showPaywall, setShowPaywall] = useState(false);

  const handleLogout = () => {
    Alert.alert(t.settings.signOut, t.settings.logoutWarning, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.signOut,
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout failed', error);
          }
        },
      },
    ]);
  };

  const SettingItem = ({
    label,
    value,
    onPress,
    isLast = false,
  }: {
    label: string;
    value?: string;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.item,
        isVintage && styles.vintageItem,
        isLast && styles.lastItem,
        isVintage && isLast && styles.vintageLastItem,
      ]}
      onPress={onPress}
    >
      <Text style={isVintage ? styles.vintageLabel : styles.label}>{label}</Text>
      <View style={styles.rightContainer}>
        {value && (
          <Text style={isVintage ? styles.vintageValue : styles.value}>
            {value}
          </Text>
        )}
        <Icon
          name="arrowRight"
          size={16}
          color={isVintage ? '#2d2a26' : '#9CA3AF'}
        />
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={isVintage ? styles.vintageSectionHeader : styles.sectionHeader}>
      {title}
    </Text>
  );

  return (
    <ScrollView
      style={isVintage ? styles.vintageContainer : styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={isVintage ? styles.vintageTitle : styles.title}>
          {t.settings.title}
        </Text>
      </View>

      {/* Account Section */}
      <SectionHeader title={t.settings.account} />
      <View style={isVintage ? styles.vintageSection : styles.section}>
        <View style={[styles.item, isVintage && styles.vintageItem]}>
          <Text style={isVintage ? styles.vintageLabel : styles.label}>
            Email
          </Text>
          <Text style={isVintage ? styles.vintageValue : styles.value}>
            {user?.email || 'Guest'}
          </Text>
        </View>
      </View>

      {/* Preferences Section */}
      <SectionHeader title="Preferences" />
      <View style={isVintage ? styles.vintageSection : styles.section}>
        <SettingItem
          label={t.settings.language}
          value={language === 'zh-TW' ? t.settings.langZh : t.settings.langEn}
          onPress={() =>
            setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')
          }
        />
        <SettingItem
          label={t.settings.theme}
          value={
            theme === 'vintage'
              ? t.settings.themeVintage
              : t.settings.themeDefault
          }
          onPress={() => setTheme(theme === 'vintage' ? 'default' : 'vintage')}
        />
        <SettingItem
          label={t.settings.standard}
          value={
            mode === 'strict'
              ? t.settings.strict
              : t.settings.conservative
          }
          onPress={() => setMode(mode === 'strict' ? 'conservative' : 'strict')}
        />
        {/* Subscription Test Button */}
        <SettingItem
          label={subscription.isPro ? "Manage Subscription" : "Upgrade to Pro (Test)"}
          value={subscription.isPro ? "Pro Active" : ""}
          onPress={() => setShowPaywall(true)}
          isLast
        />
      </View>
      <Text style={isVintage ? styles.vintageHint : styles.hint}>
        {mode === 'strict' ? t.settings.strictDesc : t.settings.conservativeDesc}
      </Text>

      {/* About Section */}
      <SectionHeader title={t.settings.about} />
      <View style={isVintage ? styles.vintageSection : styles.section}>
        <SettingItem
          label={t.settings.privacyPolicy}
          onPress={() => navigation.navigate('PrivacyPolicy' as never)}
          isLast
        />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={isVintage ? styles.vintageLogoutBtn : styles.logoutBtn}
        onPress={handleLogout}
      >
        <Text style={isVintage ? styles.vintageLogoutText : styles.logoutText}>
          {t.settings.signOut}
        </Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS grouped background color
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  vintageTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
  sectionHeader: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 24,
  },
  vintageSectionHeader: {
    fontSize: 13,
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 24,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  vintageSection: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#d1d5db',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  vintageItem: {
    backgroundColor: '#fdfbf7',
    borderBottomColor: '#d1d5db',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  vintageLastItem: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  vintageLabel: {
    fontSize: 17,
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 17,
    color: '#8E8E93',
    marginRight: 8,
  },
  vintageValue: {
    fontSize: 17,
    color: '#92400e',
    marginRight: 8,
    fontFamily: 'Courier',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginHorizontal: 32,
    marginTop: 8,
  },
  vintageHint: {
    fontSize: 13,
    color: '#92400e',
    marginHorizontal: 32,
    marginTop: 8,
    fontStyle: 'italic',
  },
  logoutBtn: {
    marginTop: 40,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  vintageLogoutBtn: {
    marginTop: 40,
    marginHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 14,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  logoutText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '600',
  },
  vintageLogoutText: {
    fontSize: 17,
    color: '#b91c1c',
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#C7C7CC',
    fontSize: 13,
  },
});
