import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { useApp } from '../store/AppContext';
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

export const AddEntry = () => {
  const { t, addEntry, mode, user, isPro, subscription } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Local state for editing values before save
  const [editedCost, setEditedCost] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');

  const commonOptions = {
    mediaType: 'photo' as const,
    includeBase64: true,
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.7 as const,
  };
  
  // Check permission before launching AI
  const checkPermission = (): boolean => {
      // 1. If active pro, allow
      if (isPro) return true;
      
      // 2. If expired pro or basic, block and show paywall
      setShowPaywall(true);
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
      setEditedName(result.itemName || '');
      setEditedCost(result.cost ? result.cost.toString() : '0');
    } catch (error) {
      Alert.alert(t.common.error, t.addEntry.analysisFailed);
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

      const getFinalValue = (
        val: number | { min: number; max: number } | null | undefined,
      ): number => {
        if (val === null || val === undefined) {
          return 0;
        }
        if (typeof val === 'number') {
          return val;
        }
        return mode === RecordMode.STRICT ? val.max : val.min;
      };

      const newEntry: Entry = {
        id: Date.now().toString(),
        date: firestore.Timestamp.now(),
        imageUrl: finalImageUrl,
        itemName: editedName || analysisResult.itemName || t.common.untitled,
        type: (analysisResult.recordType as EntryType) || 'expense',
        category: (analysisResult.category as ExpenseCategory) || 'other',
        paymentMethod: 'cash' as PaymentMethod,
        usage: (analysisResult.usage as UsageCategory) || 'want',
        cost: parseFloat(editedCost) || 0,
        calories: getFinalValue(analysisResult.calories),
        protein: getFinalValue(analysisResult.macros?.protein),
        carbs: getFinalValue(analysisResult.macros?.carbs),
        fat: getFinalValue(analysisResult.macros?.fat),
        modeUsed: mode,
        note: analysisResult.reasoning,
      };

      addEntry(newEntry);
      Alert.alert(t.common.save, t.addEntry.entrySaved);
      
      // Reset state
      setImageUri(null);
      setAnalysisResult(null);
      setEditedName('');
      setEditedCost('');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert(t.common.error, 'Failed to save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.addEntry.title}</Text>
        <Text style={styles.subtitle}>{t.addEntry.subtitle}</Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={handleCamera}>
          <Icon name="camera" size={32} color="#fff" />
          <Text style={styles.captureText}>{t.addEntry.tapToCapture}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLibrary}
        >
          <Text style={styles.secondaryButtonText}>Select from Library</Text>
        </TouchableOpacity>
        
        {/* Pro Badge/Hint if needed */}
        {!isPro && (
            <View style={styles.proHintContainer}>
                <Text style={styles.proHintText}>Upgrade to Pro to use AI Analysis</Text>
            </View>
        )}
      </View>

      {analyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.status}>{t.addEntry.analyzingTitle}</Text>
          <Text style={styles.subStatus}>{t.addEntry.analyzingDesc}</Text>
        </View>
      )}

      {!analyzing && imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        </View>
      )}

      {!analyzing && analysisResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultHeader}>{t.addEntry.reviewTitle}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.addEntry.itemName}</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.addEntry.cost}</Text>
            <TextInput
              style={styles.input}
              value={editedCost}
              onChangeText={setEditedCost}
              keyboardType="numeric"
            />
          </View>
          
          {/* Display read-only info */}
          <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>{t.addEntry.category}:</Text>
             <Text style={styles.infoValue}>{analysisResult.category}</Text>
          </View>
          <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>{t.addEntry.usage}:</Text>
             <Text style={styles.infoValue}>{analysisResult.usage}</Text>
          </View>

          <View style={{ marginTop: 20 }}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Button title={t.addEntry.saveEntry} onPress={handleSave} />
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
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  captureButton: {
    backgroundColor: '#000',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 10,
    fontWeight: 'bold',
    display: 'none', // Hide text for cleaner look, icon is enough
  },
  secondaryButton: {
    padding: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  proHintContainer: {
      marginTop: 8,
      padding: 8,
      backgroundColor: '#FEF2F2',
      borderRadius: 8,
  },
  proHintText: {
      color: '#EF4444',
      fontSize: 12,
      fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  status: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  subStatus: {
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  resultContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#666',
    fontSize: 14,
  },
  infoValue: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
