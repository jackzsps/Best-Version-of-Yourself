import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../store/AppContext';
import { Icon } from '../components/Icons';
import { PRIVACY_POLICY_TEXT } from '../../../shared/privacyPolicyData';

export const PrivacyPolicy = () => {
  const navigation = useNavigation();
  const { theme, t, language } = useApp();
  const isVintage = theme === 'vintage';

  const rawText =
    language === 'zh-TW'
      ? PRIVACY_POLICY_TEXT['zh-TW']
      : PRIVACY_POLICY_TEXT['en'];

  // Simple Markdown cleanup for React Native Text
  const policyText = rawText
    .replace(/# /g, '')
    .replace(/## /g, '\n')
    .replace(/\*\*/g, '')
    .replace(/\* /g, '• ');

  return (
    <View style={isVintage ? styles.vintageContainer : styles.container}>
      <View style={isVintage ? styles.vintageHeader : styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name="arrowRight"
            style={{ transform: [{ rotate: '180deg' }] }}
            size={24}
            color={isVintage ? '#2d2a26' : '#374151'}
          />
        </TouchableOpacity>
        <Text
          style={isVintage ? styles.vintageHeaderTitle : styles.headerTitle}
        >
          {t.settings.privacyPolicy}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={isVintage ? styles.vintageText : styles.text}>
          {policyText}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  vintageContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7', // vintage-bg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  vintageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fdfbf7',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  vintageHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  vintageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2d2a26',
    fontFamily: 'Courier',
  },
});
