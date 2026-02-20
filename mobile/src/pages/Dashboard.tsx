// Placeholder for Dashboard screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EntryList } from '../components/dashboard/EntryList';
import { useApp } from '../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthModal } from '../components/AuthModal';

export const Dashboard = () => {
  const { entries, t, user, theme } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isVintage = theme === 'vintage';
  const insets = useSafeAreaInsets();

  console.log('📊 [Dashboard] Rendering... Mode:', isVintage ? 'Vintage' : 'Default');
  return (
    <View style={[
      isVintage ? styles.vintageContainer : styles.container,
      { paddingTop: insets.top, paddingBottom: insets.bottom }
    ]}>
      <View style={[styles.header, isVintage && styles.vintageHeader]}>
        <View>
          <Text style={[styles.title, isVintage && styles.vintageTitle]}>{t.dashboard.title}</Text>
          <Text style={[styles.subtitle, isVintage && styles.vintageSubtitle]}>{t.dashboard.subtitle}</Text>
        </View>
        {!user && (
          <TouchableOpacity
            style={[styles.loginBtn, isVintage && styles.vintageLoginBtn]}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={[styles.loginBtnText, isVintage && styles.vintageLoginBtnText]}>
              {t.settings.signIn}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <EntryList entries={entries} />
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vintageHeader: {
    backgroundColor: '#fdfbf7',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    borderStyle: 'solid',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  vintageTitle: {
    fontFamily: 'Courier',
    color: '#2d2a26',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  vintageSubtitle: {
    fontFamily: 'Courier',
    color: '#57534e',
  },
  loginBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vintageLoginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2d2a26',
    borderRadius: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  vintageLoginBtnText: {
    color: '#2d2a26',
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
});
