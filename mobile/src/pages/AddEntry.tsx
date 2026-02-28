import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { useApp } from '../store/AppContext';
import { useToast } from '../store/ToastContext';
import { analyzeImage } from '../services/geminiService';
import { uploadImage } from '../services/storageService';
import {
  Entry,
  RecordMode,
  EntryType,
  ExpenseCategory,
  UsageCategory,
  PaymentMethod,
} from '../types';
import { Icon } from '../components/Icons';
import Svg, { Defs, RadialGradient as SvgRadialGradient, LinearGradient as SvgLinearGradient, Stop, Circle, Rect } from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';
import { PaywallModal } from '../components/PaywallModal';

import { TabParamList } from '../types';

const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
const ALL_USAGE_CATEGORIES: UsageCategory[] = ['must', 'need', 'want'];
const ALL_ENTRY_TYPES: EntryType[] = ['expense', 'diet', 'combined'];
const ALL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'mobile'];

// --- Helper Styles for Mobile to match Web ThemeUI ---
const getUsagePillStyle = (u: UsageCategory, isSelected: boolean, isVintage: boolean) => {
  if (isVintage) {
    if (!isSelected) {
      return { container: { backgroundColor: 'transparent', borderColor: '#8B7355', borderWidth: 1 }, text: { color: 'rgba(139, 69, 19, 0.5)' } };
    }
    switch (u) {
      case 'must': return { container: { backgroundColor: 'rgba(139, 0, 0, 0.1)', borderColor: '#8B0000', borderWidth: 1 }, text: { color: '#8B0000', fontWeight: 'bold' as const } };
      case 'need': return { container: { backgroundColor: 'rgba(44, 36, 27, 0.1)', borderColor: '#2C241B', borderWidth: 1 }, text: { color: '#2C241B', fontWeight: 'bold' as const } };
      case 'want': return { container: { backgroundColor: 'rgba(146, 64, 14, 0.1)', borderColor: '#92400E', borderWidth: 1 }, text: { color: '#92400E', fontWeight: 'bold' as const } };
      default: return { container: { backgroundColor: 'transparent', borderColor: '#8B7355', borderWidth: 1 }, text: { color: '#8B4513' } };
    }
  }

  if (!isSelected) {
    return { container: { backgroundColor: '#F3F4F6', borderColor: 'transparent', borderWidth: 1 }, text: { color: '#9CA3AF' } };
  }
  switch (u) {
    case 'must': return { container: { backgroundColor: '#FFE4E6', borderColor: '#FECDD3', borderWidth: 1 }, text: { color: '#E11D48', fontWeight: 'bold' as const } };
    case 'need': return { container: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', borderWidth: 1 }, text: { color: '#059669', fontWeight: 'bold' as const } };
    case 'want': return { container: { backgroundColor: '#EDE9FE', borderColor: '#DDD6FE', borderWidth: 1 }, text: { color: '#7C3AED', fontWeight: 'bold' as const } };
    default: return { container: { backgroundColor: '#F3F4F6', borderColor: 'transparent', borderWidth: 1 }, text: { color: '#9CA3AF' } };
  }
};

const getInputStyle = (isVintage: boolean) => {
  if (isVintage) {
    return {
      borderWidth: 0,
      borderBottomWidth: 2,
      borderColor: '#8B7355',
      backgroundColor: 'transparent',
      paddingVertical: 8,
      paddingHorizontal: 8,
      fontSize: 24,
      fontFamily: 'Courier',
      color: '#2C241B',
      borderRadius: 0
    };
  }
  return {
    borderWidth: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  };
};

export const AddEntry = ({ setActiveTab }: { setActiveTab?: (tab: keyof TabParamList) => void }) => {
  const { t, addEntry, mode, user, isPro, theme, language } = useApp();
  const toast = useToast();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const [loadingTip, setLoadingTip] = useState(0);
  const scanAnim = React.useRef(new Animated.Value(0)).current;
  const spinAnimBg = React.useRef(new Animated.Value(0)).current;

  const fallbackMessages = [
    'Analyzing image content...',
    'Detecting items & receipts...',
    'Reading prices & text...',
    'Calculating cost & macros...',
  ];
  const loadingMessages = t.addEntry?.loadingMessages || fallbackMessages;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setLoadingTip(0);
      scanAnim.setValue(0);

      interval = setInterval(() => {
        setLoadingTip((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
    return () => clearInterval(interval);
  }, [analyzing, scanAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnimBg, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnimBg]);

  const spinRotate = spinAnimBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Local state for editing values before save
  const [editedName, setEditedName] = useState<string>('');
  const [editedCost, setEditedCost] = useState<string>('');
  // Macro States
  const [editedCalories, setEditedCalories] = useState<string>('');
  const [editedProtein, setEditedProtein] = useState<string>('');
  const [editedCarbs, setEditedCarbs] = useState<string>('');
  const [editedFat, setEditedFat] = useState<string>('');
  const [activeMode, setActiveMode] = useState<RecordMode>(mode);

  // New states for form layout
  const [recordType, setRecordType] = useState<EntryType>('combined');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [usage, setUsage] = useState<UsageCategory>('need');
  const [note, setNote] = useState<string>('');

  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEntryDate(selectedDate);
    }
  };

  const isVintage = theme === 'vintage';
  const colors = isVintage ? {
    bg: '#F5E6D3', // vintage-bg
    text: '#2C241B', // vintage-ink
    card: '#E6D2B5', // vintage-card
    line: '#8B7355', // vintage-line
    leather: '#8B4513', // vintage-leather
    accent: '#8B4513',
    subText: '#5C4033', // vintage-leather/50 equivalent
    inputBg: '#F5E6D3', // Same as bg or slightly lighter
    buttonText: '#F5E6D3',
  } : {
    bg: '#fff',
    text: '#000',
    card: '#f9f9f9',
    line: '#eee',
    leather: '#000',
    accent: '#007AFF',
    subText: '#666',
    inputBg: '#fff',
    buttonText: '#fff',
  };

  const commonOptions = {
    mediaType: 'photo' as const,
    includeBase64: true,
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.7 as const,
  };

  // Sync state when analysis result or activeMode changes
  useEffect(() => {
    if (!analysisResult) return;

    // Helper to extract value based on mode
    const getVal = (val: number | { min: number; max: number } | null | undefined): string => {
      if (val === null || val === undefined) return '0';
      if (typeof val === 'number') return val.toString();
      return (activeMode === RecordMode.STRICT ? val.max : val.min).toString();
    };

    if (analysisResult) {
      setEditedCalories(getVal(analysisResult.calories));
      setEditedProtein(getVal(analysisResult.macros?.protein));
      setEditedCarbs(getVal(analysisResult.macros?.carbs));
      setEditedFat(getVal(analysisResult.macros?.fat));

      if (analysisResult.recordType && ALL_ENTRY_TYPES.includes(analysisResult.recordType)) setRecordType(analysisResult.recordType as EntryType);
      if (analysisResult.category && ALL_EXPENSE_CATEGORIES.includes(analysisResult.category)) setCategory(analysisResult.category as ExpenseCategory);
      if (analysisResult.usage && ALL_USAGE_CATEGORIES.includes(analysisResult.usage)) setUsage(analysisResult.usage as UsageCategory);
      if (analysisResult.reasoning) setNote(analysisResult.reasoning);
    }

  }, [analysisResult, activeMode]);

  // Initial load of Name/Cost when analysisResult is first set
  useEffect(() => {
    if (analysisResult) {
      setEditedName(analysisResult.itemName || '');
      setEditedCost(analysisResult.cost ? analysisResult.cost.toString() : '0');
    }
  }, [analysisResult]);

  // Check permission before launching AI
  const checkPermission = (): boolean => {
    // 1. If active pro, allow
    if (isPro) return true;

    // 2. If expired pro or basic, block and show paywall with slogan
    Alert.alert(
      t.addEntry.subscriptionExpired,
      t.addEntry.subscriptionExpiredDesc,
      [
        { text: t.common.cancel, style: "cancel" },
        { text: t.addEntry.upgrade, onPress: () => setShowPaywall(true) }
      ]
    );
    return false;
  }

  const handleCamera = async () => {
    if (!checkPermission()) return;

    const result = await launchCamera(commonOptions as CameraOptions);
    if (result.assets && result.assets[0]) {
      processImage(result.assets[0]);
    }
  };

  const handleLibrary = async () => {
    if (!checkPermission()) return;

    const result = await launchImageLibrary(commonOptions as ImageLibraryOptions);
    if (result.assets && result.assets[0]) {
      processImage(result.assets[0]);
    }
  };

  const handleManualEntry = () => {
    // Manual entry does not require Pro subscription (parity with Web)
    setImageUri(null);
    setAnalyzing(false);

    // Create a default/empty analysis result to render the form
    const defaultResult = {
      isFood: false,
      isExpense: true,
      recordType: 'combined' as EntryType,
      itemName: '',
      category: 'other' as ExpenseCategory,
      usage: 'need' as UsageCategory,
      cost: 0,
      calories: null,
      macros: null,
      reasoning: ''
    };

    setAnalysisResult(defaultResult);
    setEditedName('');
    setEditedCost('');
    setEditedCalories('');
    setEditedProtein('');
    setEditedCarbs('');
    setEditedFat('');
    setRecordType('combined');
    setCategory('other');
    setPaymentMethod('cash');
    setUsage('need');
    setNote('');
    setEntryDate(new Date());
  };

  const processImage = async (asset: any) => {
    if (!asset.base64 || !asset.uri) {
      return;
    }
    setImageUri(asset.uri);
    setAnalyzing(true);
    setAnalysisResult(null); // Clear previous result

    try {
      const result = await analyzeImage(asset.base64, language);
      setAnalysisResult(result);
      // State updates handled by useEffect
    } catch (error: any) {
      // Replaced Alert with Toast for better UX and consistency with Web
      if (error.isNetworkError) {
        toast.info(t.common.offline || "No Internet", "Image will be processed later (mock)."); // Mock message as logic differs
      } else {
        toast.error(t.common.error, t.addEntry.analysisFailed);
      }
      console.error("Analysis Error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysisResult || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUri;

      // Upload image if it's a local file
      if (imageUri && !imageUri.startsWith('http')) {
        finalImageUrl = await uploadImage(imageUri, user.uid);
      }

      // Date Logic Normalization (Parity with Web: Noon 12:00:00)
      const dateAtNoon = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 12, 0, 0);

      const newEntry: Entry = {
        id: Date.now().toString(),
        date: firestore.Timestamp.fromDate(dateAtNoon),
        imageUrl: finalImageUrl,
        itemName: editedName || t.common.untitled,
        type: recordType,
        category: category,
        paymentMethod: paymentMethod,
        usage: usage,
        cost: recordType === 'diet' ? 0 : (parseFloat(editedCost) || 0),
        calories: recordType === 'expense' ? 0 : (parseFloat(editedCalories) || 0),
        protein: recordType === 'expense' ? 0 : (parseFloat(editedProtein) || 0),
        carbs: recordType === 'expense' ? 0 : (parseFloat(editedCarbs) || 0),
        fat: recordType === 'expense' ? 0 : (parseFloat(editedFat) || 0),
        modeUsed: activeMode,
        note: note || null,
      };

      await addEntry(newEntry);

      // Replaced Alert with Toast
      toast.success(t.common.save, t.addEntry.entrySaved);

      // Navigate to Home
      if (setActiveTab) {
        setActiveTab('Home');
      }

      // Reset state
      setImageUri(null);
      setAnalysisResult(null);
      setEditedName('');
      setEditedCost('');
      setEditedCalories('');
      setEditedProtein('');
      setEditedCarbs('');
      setEditedFat('');
      setRecordType('combined');
      setCategory('other');
      setPaymentMethod('cash');
      setUsage('need');
      setNote('');
      setEntryDate(new Date());

    } catch (error) {
      console.error('Save failed:', error);
      // Replaced Alert with Toast
      toast.error(t.common.error, 'Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDiet = analysisResult?.recordType === 'diet' || analysisResult?.recordType === 'combined';
  const isExpense = analysisResult?.recordType === 'expense' || analysisResult?.recordType === 'combined';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.title}</Text>
        <Text style={[styles.subtitle, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.subtitle}</Text>
      </View>

      {/* Action Buttons: Show only when not analyzing and no result yet */}
      {!analyzing && !analysisResult && (
        <View style={styles.actionContainer}>
          {/* Background Glows for Default Theme */}
          {!isVintage && (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { transform: [{ rotate: spinRotate }] }]}>
                <Svg height="400" width="400" viewBox="0 0 400 400">
                  <Defs>
                    <SvgRadialGradient id="glow1" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%" stopColor="#81E0CA" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#81E0CA" stopOpacity="0" />
                    </SvgRadialGradient>
                    <SvgRadialGradient id="glow2" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%" stopColor="#FFB3B3" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#FFB3B3" stopOpacity="0" />
                    </SvgRadialGradient>
                  </Defs>
                  <Circle cx="120" cy="120" r="140" fill="url(#glow1)" />
                  <Circle cx="280" cy="280" r="140" fill="url(#glow2)" />
                </Svg>
              </Animated.View>
            </View>
          )}

          <TouchableOpacity style={[styles.captureButton, isVintage && styles.vintageButton, { backgroundColor: isVintage ? colors.card : '#fff', borderColor: isVintage ? colors.line : undefined, borderWidth: isVintage ? 2 : 0, shadowColor: isVintage ? 'transparent' : '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }]} onPress={handleCamera}>
            <Icon name="camera" size={32} color={isVintage ? colors.text : '#1F2937'} />
          </TouchableOpacity>
          <Text style={[styles.captureText, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.tapToCapture}</Text>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLibrary}
            >
              <Text style={[styles.secondaryButtonText, { color: isVintage ? colors.text : colors.accent, fontFamily: isVintage ? 'Courier' : undefined, textDecorationLine: isVintage ? 'underline' : 'none' }]}>Select from Library</Text>
            </TouchableOpacity>

            <Text style={[styles.orText, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>- {t.addEntry.or || 'or'} -</Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleManualEntry}
            >
              <View style={styles.manualButtonContent}>
                <Icon name="edit" size={16} color={isVintage ? colors.text : colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: isVintage ? colors.text : colors.accent, fontFamily: isVintage ? 'Courier' : undefined, textDecorationLine: isVintage ? 'underline' : 'none' }]}> {t.addEntry.manual}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Pro Badge/Hint if needed */}
          {!isPro && (
            <View style={[styles.proHintContainer, { backgroundColor: isVintage ? colors.card : '#FEF2F2' }]}>
              <Text style={[styles.proHintText, { color: isVintage ? colors.text : '#EF4444', fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.subscriptionExpiredDesc}</Text>
            </View>
          )}
        </View>
      )}

      {analyzing && (
        <View style={styles.loadingContainer}>
          {imageUri ? (
            <View style={styles.scanImageContainer}>
              <Image source={{ uri: imageUri }} style={[styles.scanImage, isVintage && { borderWidth: 4, borderColor: colors.line }]} />
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: isVintage ? colors.line : colors.accent,
                    transform: [{
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-64, 128]
                      })
                    }]
                  }
                ]}
              />
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.text} style={{ marginBottom: 16 }} />
          )}
          <Text style={[styles.status, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
            {loadingMessages[loadingTip]}
          </Text>
          <Text style={[styles.subStatus, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>
            {t.addEntry.analyzingDesc}
          </Text>
        </View>
      )}

      {!analyzing && imageUri && (
        <View style={[styles.previewBannerContainer]}>
          <View style={[styles.previewBanner, isVintage && { borderWidth: 4, borderColor: '#fff', borderRadius: 2, marginHorizontal: 20 }]}>
            <Image source={{ uri: imageUri }} style={styles.bannerImage} />
            <View style={StyleSheet.absoluteFillObject}>
              <Svg height="100%" width="100%">
                <Defs>
                  <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000" stopOpacity="0" />
                    <Stop offset="1" stopColor="#000" stopOpacity="0.7" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#grad)" />
              </Svg>
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerTitle, isVintage && { fontFamily: 'Courier' }]} numberOfLines={2}>
                {editedName || t.common.untitled}
              </Text>
            </View>
          </View>
        </View>
      )}

      {!analyzing && analysisResult && (
        <View style={styles.reviewLayout}>
          {/* Entry Types Tabs */}
          <View style={[styles.entryTabs, isVintage && styles.vintageEntryTabs]}>
            {ALL_ENTRY_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.entryTab,
                  recordType === type && (isVintage ? styles.vintageEntryTabActive : styles.bentoEntryTabActive),
                  !isVintage && recordType !== type && styles.bentoEntryTabInactive
                ]}
                onPress={() => setRecordType(type)}
              >
                <Text style={[
                  styles.entryTabText,
                  isVintage && { fontFamily: 'Courier' },
                  recordType === type
                    ? (isVintage ? styles.vintageEntryTabTextActive : styles.bentoEntryTabTextActive)
                    : (isVintage ? styles.vintageEntryTabTextInactive : styles.bentoEntryTabTextInactive)
                ]}>
                  {t.entryTypes ? t.entryTypes[type] : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.resultContainer, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid' }]}>
            <Text style={[styles.resultHeader, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.reviewTitle}</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                {t.addEntry.date || 'Date'}
              </Text>
              {Platform.OS === 'ios' ? (
                <View style={{ alignSelf: 'flex-start' }}>
                  <DateTimePicker
                    value={entryDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    themeVariant={"light"}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, borderRadius: isVintage ? 0 : 8, paddingVertical: 14 }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, fontSize: 16 }}>
                      {entryDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={entryDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.itemName}</Text>
              <TextInput
                style={[getInputStyle(isVintage)]}
                value={editedName}
                onChangeText={setEditedName}
                placeholder={t.addEntry.itemName}
                placeholderTextColor={colors.subText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {ALL_EXPENSE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pillBtn,
                      category === cat
                        ? (isVintage ? { backgroundColor: colors.text, borderColor: colors.text, borderWidth: 1 } : { backgroundColor: colors.bg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 })
                        : { backgroundColor: isVintage ? 'transparent' : '#F3F4F6', borderColor: isVintage ? colors.line : 'transparent', borderWidth: 1 },
                      isVintage ? { borderRadius: 0 } : { borderRadius: 20 }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.pillText,
                      isVintage && { fontFamily: 'Courier' },
                      category === cat
                        ? (isVintage ? { color: colors.bg, fontWeight: 'bold' } : { color: '#000', fontWeight: 'bold' })
                        : { color: isVintage ? colors.subText : '#666' }
                    ]}>
                      {t.categories ? t.categories[cat] : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {(recordType === 'expense' || recordType === 'combined') && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.usage}</Text>
                <View style={styles.pillContainer}>
                  {ALL_USAGE_CATEGORIES.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.pillBtn,
                        { flex: 1, alignItems: 'center' },
                        getUsagePillStyle(u, usage === u, isVintage).container,
                        isVintage ? { borderRadius: 0 } : { borderRadius: 20 }
                      ]}
                      onPress={() => setUsage(u)}
                    >
                      <Text style={[
                        styles.pillText,
                        isVintage && { fontFamily: 'Courier' },
                        getUsagePillStyle(u, usage === u, isVintage).text
                      ]}>
                        {t.usage ? t.usage[u] : u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(recordType === 'expense' || recordType === 'combined') && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.paymentMethod}</Text>
                <View style={styles.pillContainer}>
                  {ALL_PAYMENT_METHODS.map(pm => (
                    <TouchableOpacity
                      key={pm}
                      style={[
                        styles.pillBtn,
                        { flex: 1, alignItems: 'center' },
                        paymentMethod === pm
                          ? (isVintage ? { backgroundColor: colors.text, borderColor: colors.text, borderWidth: 1 } : { backgroundColor: colors.bg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 })
                          : { backgroundColor: isVintage ? 'transparent' : '#F3F4F6', borderColor: isVintage ? colors.line : 'transparent', borderWidth: 1 },
                        isVintage ? { borderRadius: 0 } : { borderRadius: 20 }
                      ]}
                      onPress={() => setPaymentMethod(pm)}
                    >
                      <Text style={[
                        styles.pillText,
                        isVintage && { fontFamily: 'Courier' },
                        paymentMethod === pm
                          ? (isVintage ? { color: colors.bg, fontWeight: 'bold' } : { color: '#000', fontWeight: 'bold' })
                          : { color: isVintage ? colors.subText : '#666' }
                      ]}>
                        {t.paymentMethods ? t.paymentMethods[pm] : pm}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Cost Input */}
            {(recordType === 'expense' || recordType === 'combined') && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.cost}</Text>
                <TextInput
                  style={[getInputStyle(isVintage)]}
                  value={editedCost}
                  onChangeText={setEditedCost}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.subText}
                />
              </View>
            )}

            {/* --- Diet Section (Strict/Conservative Toggle + Inputs) --- */}
            {(recordType === 'diet' || recordType === 'combined') && (
              <View style={[styles.dietContainer, { borderColor: colors.line, borderTopWidth: 1, paddingTop: 16, marginTop: 8 }]}>
                {/* Mode Toggle */}
                <View style={[styles.modeToggle, { borderColor: colors.line, borderRadius: isVintage ? 0 : 8, backgroundColor: isVintage ? 'transparent' : colors.line }]}>
                  <TouchableOpacity
                    style={[styles.modeButton, activeMode === RecordMode.STRICT && { backgroundColor: isVintage ? colors.text : '#fff', shadowOpacity: 0.1 }]}
                    onPress={() => setActiveMode(RecordMode.STRICT)}
                  >
                    <Text style={[styles.modeText, activeMode === RecordMode.STRICT ? { color: isVintage ? colors.bg : '#000', fontWeight: 'bold' } : { color: colors.subText }, isVintage && { fontFamily: 'Courier' }]}>{t.addEntry.modeStrict}</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, backgroundColor: colors.line }} />
                  <TouchableOpacity
                    style={[styles.modeButton, activeMode === RecordMode.CONSERVATIVE && { backgroundColor: isVintage ? colors.leather : '#fff', shadowOpacity: 0.1 }]}
                    onPress={() => setActiveMode(RecordMode.CONSERVATIVE)}
                  >
                    <Text style={[styles.modeText, activeMode === RecordMode.CONSERVATIVE ? { color: isVintage ? colors.bg : '#000', fontWeight: 'bold' } : { color: colors.subText }, isVintage && { fontFamily: 'Courier' }]}>{t.addEntry.modeConservative}</Text>
                  </TouchableOpacity>
                </View>

                {/* Calories Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.calories}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8 }]}
                    value={editedCalories}
                    onChangeText={setEditedCalories}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.subText}
                  />
                </View>

                {/* Macros Row */}
                <View style={styles.macrosRow}>
                  <View style={styles.macroInput}>
                    <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, fontSize: 12 }]}>{t.addEntry.protein}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8 }]}
                      value={editedProtein}
                      onChangeText={setEditedProtein}
                      keyboardType="numeric"
                      placeholder="g"
                      placeholderTextColor={colors.subText}
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, fontSize: 12 }]}>{t.addEntry.carbs}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8 }]}
                      value={editedCarbs}
                      onChangeText={setEditedCarbs}
                      keyboardType="numeric"
                      placeholder="g"
                      placeholderTextColor={colors.subText}
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, fontSize: 12 }]}>{t.addEntry.fat}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8 }]}
                      value={editedFat}
                      onChangeText={setEditedFat}
                      keyboardType="numeric"
                      placeholder="g"
                      placeholderTextColor={colors.subText}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.note}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8, textAlignVertical: 'top' }]}
                value={note}
                onChangeText={setNote}
                placeholder={t.addEntry.note}
                placeholderTextColor={colors.subText}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ marginTop: 20, gap: 10 }}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <View>
                  <TouchableOpacity accessible={true} accessibilityLabel={t.addEntry.saveEntry} style={[styles.saveButton, { backgroundColor: isVintage ? colors.leather : '#000', borderRadius: isVintage ? 4 : 12 }]} onPress={handleSave}>
                    <Text style={[styles.saveButtonText, { color: colors.buttonText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.saveEntry}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity accessible={true} accessibilityLabel={t.common.cancel} style={[styles.cancelButton, { borderColor: isVintage ? colors.text : colors.line, borderWidth: isVintage ? 1 : 0, backgroundColor: isVintage ? 'transparent' : colors.card }]} onPress={() => { setAnalysisResult(null); setImageUri(null); }}>
                    <Text style={[styles.cancelButtonText, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.common.cancel}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  vintageButton: {
    shadowColor: '#2d2a26',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderRadius: 0, // Square vintage button
  },
  captureText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  manualButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  orText: {
    fontSize: 12,
    marginVertical: 4,
    opacity: 0.5,
  },
  proHintContainer: {
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    width: '90%',
  },
  proHintText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  scanImageContainer: {
    width: 128,
    height: 128,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
    position: 'relative',
  },
  scanImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    opacity: 0.3,
  },
  status: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  subStatus: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    opacity: 0.7,
  },
  previewBannerContainer: {
    width: '100%',
    marginBottom: 24,
  },
  previewBanner: {
    width: '100%',
    height: 256,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 24,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  resultContainer: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewLayout: {
    gap: 16,
    marginBottom: 40,
  },
  entryTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  vintageEntryTabs: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
    borderRadius: 0,
    padding: 0,
  },
  entryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  vintageEntryTabActive: {
    backgroundColor: 'transparent',
    borderBottomWidth: 4,
    borderBottomColor: '#2C241B',
    borderRadius: 0,
  },
  bentoEntryTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bentoEntryTabInactive: {
    backgroundColor: 'transparent',
  },
  entryTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  vintageEntryTabTextActive: {
    color: '#2C241B',
  },
  bentoEntryTabTextActive: {
    color: '#000',
  },
  vintageEntryTabTextInactive: {
    color: '#5C4033',
    opacity: 0.6,
  },
  bentoEntryTabTextInactive: {
    color: '#666',
  },
  pillScroll: {
    flexDirection: 'row',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultHeader: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  dietContainer: {
    marginBottom: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  macroInput: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '700',
    fontSize: 15,
    textTransform: 'capitalize',
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontWeight: '800',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
