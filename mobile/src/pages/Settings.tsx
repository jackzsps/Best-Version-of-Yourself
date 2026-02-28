import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import functions from '@react-native-firebase/functions';
import { useApp } from '../store/AppContext';
import { Icon } from '../components/Icons';
import { PaywallModal } from '../components/PaywallModal';
import { AuthModal } from '../components/AuthModal';
import { RecordMode } from '../types';

export const Settings = () => {
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
    subscription,
    isPro
  } = useApp();
  const isVintage = theme === 'vintage';
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      t.settings.deleteAccount,
      t.settings.deleteAccountWarning,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.deleteAccount,
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const deleteAccountFn = functions().httpsCallable('deleteAccount');
              await deleteAccountFn();

              // Logout locally after successful backend deletion
              await logout();
              Alert.alert('Success', 'Your account has been deleted.');
            } catch (error: any) {
              console.error('Delete account failed', error);
              Alert.alert('Error', error.message || 'Failed to delete account. Please try logging in again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getSubscriptionStatusText = () => {
    if (!subscription) return "";

    if (!isPro) {
      if (subscription.status === 'pro' || subscription.status === 'trial') return "Expired";
      return "Free";
    }

    if (subscription.status === 'trial') return "Pro (Trial)";
    if (subscription.status === 'pro') return "Pro Active";

    return "";
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
    <Text style={[isVintage ? styles.vintageSectionHeader : styles.sectionHeader, { marginTop: 24, marginLeft: 20 }]}>
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
        {user ? (
          <View style={[styles.item, isVintage && styles.vintageItem, styles.lastItem]}>
            <Text style={isVintage ? styles.vintageLabel : styles.label}>
              Email
            </Text>
            <Text style={isVintage ? styles.vintageValue : styles.value}>
              {user.email}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            testID="settings-signin-button"
            style={[styles.item, isVintage && styles.vintageItem, styles.lastItem]}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={isVintage ? styles.vintageLabel : styles.label}>
              {t.settings.signIn}
            </Text>
            <View style={styles.rightContainer}>
              <Text style={isVintage ? styles.vintageValue : styles.value}>
                Guest
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
            mode === RecordMode.STRICT
              ? t.settings.strict
              : t.settings.conservative
          }
          onPress={() => setMode(mode === RecordMode.STRICT ? RecordMode.CONSERVATIVE : RecordMode.STRICT)}
        />
        {/* Subscription Test Button */}
        {user && (
          <SettingItem
            label={isPro ? "Manage Subscription" : "Upgrade to Pro (Test)"}
            value={getSubscriptionStatusText()}
            onPress={() => setShowPaywall(true)}
            isLast
          />
        )}
      </View>
      <Text style={isVintage ? styles.vintageHint : styles.hint}>
        {mode === RecordMode.STRICT ? t.settings.strictDesc : t.settings.conservativeDesc}
      </Text>

      {/* About Section */}
      <SectionHeader title={t.settings.about} />
      <View style={isVintage ? styles.vintageSection : styles.section}>
        <SettingItem
          label={t.settings.privacyPolicy}
          onPress={() => {
            // Replaced stack navigation with an external link temporarily
            Linking.openURL('https://gemini.google.com/privacy'); // Default to placeholder
          }}
          isLast
        />
      </View>

      {/* Logout & Delete Account */}
      {user && (
        <>
          <TouchableOpacity
            style={isVintage ? styles.vintageLogoutBtn : styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={isVintage ? styles.vintageLogoutText : styles.logoutText}>
              {t.settings.signOut}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={isVintage ? styles.vintageDeleteBtn : styles.deleteBtn}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <Text style={isVintage ? styles.vintageDeleteText : styles.deleteText}>
                {t.settings.deleteAccount}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.versionText}>Version 1.0.0</Text>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // softer background matching Dashboard
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#F5F0E6', // warmer vintage paper matching Dashboard
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  vintageTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2d2a26',
    fontFamily: 'Courier',
    letterSpacing: -0.5,
  },
  sectionHeader: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '700',
  },
  vintageSectionHeader: {
    fontSize: 13,
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: 'Courier',
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  vintageSection: {
    backgroundColor: '#fdfbf7',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vintageItem: {
    backgroundColor: '#fdfbf7',
    borderBottomColor: '#d1d5db',
    borderBottomWidth: 1,
    borderStyle: 'solid',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  vintageLastItem: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  vintageLabel: {
    fontSize: 16,
    color: '#2d2a26',
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  vintageValue: {
    fontSize: 16,
    color: '#92400e',
    marginRight: 8,
    fontFamily: 'Courier',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginHorizontal: 32,
    marginTop: 12,
    lineHeight: 18,
  },
  vintageHint: {
    fontSize: 13,
    color: '#92400e',
    marginHorizontal: 32,
    marginTop: 12,
    fontStyle: 'italic',
  },
  logoutBtn: {
    marginTop: 40,
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  vintageLogoutBtn: {
    marginTop: 40,
    marginHorizontal: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 16,
    alignItems: 'center',
    borderStyle: 'solid',
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
  vintageLogoutText: {
    fontSize: 16,
    color: '#b91c1c',
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  deleteBtn: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  vintageDeleteBtn: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: 'transparent',
    padding: 14,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    opacity: 0.8,
  },
  vintageDeleteText: {
    fontSize: 15,
    color: '#b91c1c',
    fontWeight: '600',
    fontFamily: 'Courier',
    textDecorationLine: 'underline',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
