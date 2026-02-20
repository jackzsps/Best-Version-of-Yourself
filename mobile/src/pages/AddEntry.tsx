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
} from 'react-native';
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
import firestore from '@react-native-firebase/firestore';
import { PaywallModal } from '../components/PaywallModal';

import { TabParamList } from '../types';

export const AddEntry = ({ setActiveTab }: { setActiveTab?: (tab: keyof TabParamList) => void }) => {
  const { t, addEntry, mode, user, isPro, theme } = useApp();
  const toast = useToast();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Local state for editing values before save
  const [editedName, setEditedName] = useState<string>('');
  const [editedCost, setEditedCost] = useState<string>('');
  // Macro States
  const [editedCalories, setEditedCalories] = useState<string>('');
  const [editedProtein, setEditedProtein] = useState<string>('');
  const [editedCarbs, setEditedCarbs] = useState<string>('');
  const [editedFat, setEditedFat] = useState<string>('');
  const [activeMode, setActiveMode] = useState<RecordMode>(mode);

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
  };

  const processImage = async (asset: any) => {
    if (!asset.base64 || !asset.uri) {
      return;
    }
    setImageUri(asset.uri);
    setAnalyzing(true);
    setAnalysisResult(null); // Clear previous result

    try {
      const result = await analyzeImage(asset.base64);
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
      const now = new Date();
      const dateAtNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

      const newEntry: Entry = {
        id: Date.now().toString(),
        date: firestore.Timestamp.fromDate(dateAtNoon),
        imageUrl: finalImageUrl,
        itemName: editedName || analysisResult.itemName || t.common.untitled,
        type: (analysisResult.recordType as EntryType) || 'expense',
        category: (analysisResult.category as ExpenseCategory) || 'other',
        paymentMethod: 'cash' as PaymentMethod,
        usage: (analysisResult.usage as UsageCategory) || 'want',
        cost: parseFloat(editedCost) || 0,
        // Use edited values
        calories: parseFloat(editedCalories) || 0,
        protein: parseFloat(editedProtein) || 0,
        carbs: parseFloat(editedCarbs) || 0,
        fat: parseFloat(editedFat) || 0,
        modeUsed: activeMode, // Save the mode used for this specific entry
        note: analysisResult.reasoning,
      };

      addEntry(newEntry);

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
          <TouchableOpacity style={[styles.captureButton, isVintage && styles.vintageButton, { backgroundColor: isVintage ? colors.card : '#000', borderColor: isVintage ? colors.line : undefined, borderWidth: isVintage ? 2 : 0 }]} onPress={handleCamera}>
            <Icon name="camera" size={32} color={isVintage ? colors.text : '#fff'} />
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
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.status, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.analyzingTitle}</Text>
          <Text style={[styles.subStatus, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.analyzingDesc}</Text>
        </View>
      )}

      {!analyzing && imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={[styles.previewImage, isVintage && { borderWidth: 4, borderColor: '#fff', borderRadius: 2 }]} />
        </View>
      )}

      {!analyzing && analysisResult && (
        <View style={[styles.resultContainer, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid' }]}>
          <Text style={[styles.resultHeader, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.reviewTitle}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.itemName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8 }]}
              value={editedName}
              onChangeText={setEditedName}
              placeholder={t.addEntry.itemName}
              placeholderTextColor={colors.subText}
            />
          </View>

          {isExpense && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.cost}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.line, color: colors.text, fontFamily: isVintage ? 'Courier' : undefined, borderRadius: isVintage ? 0 : 8 }]}
                value={editedCost}
                onChangeText={setEditedCost}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.subText}
              />
            </View>
          )}

          {/* --- Diet Section (Strict/Conservative Toggle + Inputs) --- */}
          {isDiet && (
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

          {/* Display read-only info (Mocked for manual entry as default) */}
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Text style={[styles.infoLabel, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.category}:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{analysisResult.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.usage}:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>{analysisResult.usage}</Text>
          </View>

          <View style={{ marginTop: 20, gap: 10 }}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: isVintage ? colors.leather : '#000', borderRadius: isVintage ? 4 : 12 }]} onPress={handleSave}>
                  <Text style={[styles.saveButtonText, { color: colors.buttonText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.addEntry.saveEntry}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.line, borderRadius: isVintage ? 4 : 12 }]} onPress={() => {
                  setAnalysisResult(null);
                  setImageUri(null);
                }}>
                  <Text style={[styles.cancelButtonText, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>{t.common.cancel}</Text>
                </TouchableOpacity>
              </>
            )}
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
  actionContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
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
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    resizeMode: 'cover',
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
