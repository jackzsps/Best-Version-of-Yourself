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
  Image,
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

  const getExpiryDisplay = () => {
    if (!subscription?.expiryDate) return null;

    try {
      if (typeof (subscription.expiryDate as any).toDate === 'function') {
        const date = (subscription.expiryDate as any).toDate();
        return date.toLocaleDateString();
      }
      if ((subscription.expiryDate as any).seconds) {
        const date = new Date((subscription.expiryDate as any).seconds * 1000);
        return date.toLocaleDateString();
      }
      return null;
    } catch {
      return null;
    }
  }

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
      activeOpacity={0.7}
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
          color={isVintage ? '#2c241b' : '#9CA3AF'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={isVintage ? styles.vintageContainer : styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={isVintage ? styles.vintageTitle : styles.title}>
          {t.settings.title}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Account Section */}
        <View style={isVintage ? styles.vintageSection : styles.section}>
          <Text style={isVintage ? styles.vintageSectionHeader : styles.sectionHeader}>
            {t.settings.account}
          </Text>

          {user ? (
            <View>
              {/* Profile Bar */}
              <View style={styles.profileBox}>
                <View style={[styles.avatar, isVintage ? styles.vintageAvatarBg : styles.avatarBg]}>
                  {user.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={[styles.avatarImage, isVintage && styles.vintageAvatarImage]} />
                  ) : (
                    <Text style={[styles.avatarText, isVintage ? styles.vintageAvatarText : {}]}>
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, isVintage && styles.vintageProfileName]} numberOfLines={1}>
                    {user.displayName || 'User'}
                  </Text>
                  <Text style={[styles.profileEmail, isVintage && styles.vintageProfileEmail]} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View style={[styles.proBadge, isPro ? (isVintage ? styles.vintageProBadgeActive : styles.proBadgeActive) : (isVintage ? styles.vintageProBadgeInactive : styles.proBadgeInactive)]}>
                    <Text style={[styles.proBadgeText, isPro ? (isVintage ? styles.vintageProBadgeTextActive : styles.proBadgeTextActive) : (isVintage ? styles.vintageProBadgeTextInactive : styles.proBadgeTextInactive)]}>
                      {getSubscriptionStatusText() || 'Basic'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.readOnlyItem}>
                <Text style={isVintage ? styles.vintageLabel : styles.label}>Email</Text>
                <Text style={isVintage ? styles.vintageValue : styles.value}>{user.email || 'Guest'}</Text>
              </View>

              {isPro && (
                <View style={[styles.readOnlyItem, { borderBottomWidth: 0 }]}>
                  <Text style={isVintage ? styles.vintageLabel : styles.label}>Expires</Text>
                  <Text style={isVintage ? styles.vintageValue : styles.value}>{getExpiryDisplay() || 'Never'}</Text>
                </View>
              )}

              <TouchableOpacity style={isVintage ? styles.vintageLogoutBtn : styles.logoutBtn} onPress={handleLogout}>
                <Text style={isVintage ? styles.vintageLogoutBtnText : styles.logoutBtnText}>{t.settings.signOut}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={isVintage ? styles.vintageDeleteBtn : styles.deleteBtn} onPress={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? (
                  <ActivityIndicator color={isVintage ? '#2c241b' : '#DC2626'} />
                ) : (
                  <Text style={isVintage ? styles.vintageDeleteBtnText : styles.deleteBtnText}>{t.settings.deleteAccount}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={isVintage ? styles.vintageAuthDesc : styles.authDesc}>
                {t.settings.authDesc}
              </Text>
              <TouchableOpacity style={isVintage ? styles.vintageSignInBtn : styles.signInBtn} onPress={() => setShowAuthModal(true)}>
                <Text style={isVintage ? styles.vintageSignInBtnText : styles.signInBtnText}>{t.settings.signIn}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View style={isVintage ? styles.vintageSection : styles.section}>
          <Text style={isVintage ? styles.vintageSectionHeader : styles.sectionHeader}>
            Preferences
          </Text>
          <View>
            <SettingItem
              label={t.settings.language}
              value={language === 'zh-TW' ? t.settings.langZh : t.settings.langEn}
              onPress={() => setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')}
            />
            <SettingItem
              label={t.settings.theme}
              value={theme === 'vintage' ? t.settings.themeVintage : t.settings.themeDefault}
              onPress={() => setTheme(theme === 'vintage' ? 'default' : 'vintage')}
            />
            <SettingItem
              label={t.settings.standard}
              value={mode === RecordMode.STRICT ? t.settings.strict : t.settings.conservative}
              onPress={() => setMode(mode === RecordMode.STRICT ? RecordMode.CONSERVATIVE : RecordMode.STRICT)}
            />
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
        </View>

        {/* About Section */}
        <View style={isVintage ? styles.vintageSection : styles.section}>
          <Text style={isVintage ? styles.vintageSectionHeader : styles.sectionHeader}>
            {t.settings.about}
          </Text>
          <View>
            <SettingItem
              label={t.settings.privacyPolicy}
              onPress={() => {
                Linking.openURL('https://gemini.google.com/privacy'); // Default to placeholder
              }}
              isLast
            />
          </View>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>

      </View>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // softer background matching View
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#F5E6D3', // warmer vintage paper matching Dashboard
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  vintageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c241b',
    fontFamily: 'Courier',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  vintageSection: {
    backgroundColor: '#F5E6D3', // vintage-card is sometimes F5E6D3 or F9F5EB. Web is vintage-card. Using #E6D2B5 from AddEntry.tsx
    padding: 24,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#2c241b',
    shadowColor: '#2c241b',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  vintageSectionHeader: {
    fontSize: 18,
    color: '#2c241b',
    fontFamily: 'Courier',
    fontWeight: 'bold',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#8B7355',
    paddingBottom: 4,
    alignSelf: 'flex-start',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarBg: {
    backgroundColor: '#EEF2FF', // brand-100
  },
  vintageAvatarBg: {
    backgroundColor: '#2c241b',
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5', // brand-600
  },
  vintageAvatarText: {
    color: '#F5E6D3',
    fontFamily: 'Courier',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vintageAvatarImage: {
    borderWidth: 2,
    borderColor: '#2c241b',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  vintageProfileName: {
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#2c241b',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vintageProfileEmail: {
    fontSize: 14,
    color: '#8B4513',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  proBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  proBadgeActive: {
    backgroundColor: '#FEF08A', // yellow-200
  },
  proBadgeInactive: {
    backgroundColor: '#F3F4F6', // gray-100
  },
  vintageProBadgeActive: {
    backgroundColor: '#2c241b',
    borderRadius: 0,
  },
  vintageProBadgeInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2c241b',
    borderRadius: 0,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  proBadgeTextActive: {
    color: '#854D0E', // yellow-800
  },
  proBadgeTextInactive: {
    color: '#6B7280',
  },
  vintageProBadgeTextActive: {
    color: '#F5E6D3',
    fontFamily: 'Courier',
  },
  vintageProBadgeTextInactive: {
    color: '#2c241b',
    fontFamily: 'Courier',
  },
  readOnlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  authDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  vintageAuthDesc: {
    fontSize: 16,
    color: '#8B4513',
    fontFamily: 'Courier',
    marginBottom: 24,
  },
  signInBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vintageSignInBtn: {
    backgroundColor: '#2c241b',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 2,
    shadowColor: '#2c241b',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  signInBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  vintageSignInBtnText: {
    color: '#F5E6D3',
    fontFamily: 'Courier',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutBtn: {
    backgroundColor: '#F3F4F6', // buttonSecondary
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  vintageLogoutBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2c241b',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    borderRadius: 2,
  },
  logoutBtnText: {
    color: '#1F2937', // text-gray-800
    fontWeight: '700',
    fontSize: 14,
  },
  vintageLogoutBtnText: {
    color: '#2c241b',
    fontFamily: 'Courier',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2', // buttonDanger
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  vintageDeleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2c241b',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 2,
  },
  deleteBtnText: {
    color: '#DC2626', // text-red-600
    fontWeight: '700',
    fontSize: 14,
  },
  vintageDeleteBtnText: {
    color: '#2c241b',
    fontFamily: 'Courier',
    fontWeight: 'bold',
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vintageItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 0,
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
    color: '#2c241b',
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  vintageValue: {
    fontSize: 14,
    color: '#8B4513',
    marginRight: 8,
    fontFamily: 'Courier',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 16,
    lineHeight: 18,
  },
  vintageHint: {
    fontSize: 12,
    color: '#8B4513',
    marginTop: 16,
    fontFamily: 'Courier',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
});

