// Placeholder for AddEntry screen
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
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useApp } from '../store/AppContext';
import { analyzeImage } from '../services/geminiService';
import {
  Entry,
  RecordMode,
  EntryType,
  ExpenseCategory,
  UsageCategory,
  PaymentMethod,
} from '../types';
import { Icon } from '../components/Icons';
import firestore from '@react-native-firebase/firestore'; // Import firestore to use Timestamp

export const AddEntry = () => {
  const { t, addEntry, mode } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null); // Replace 'any' with appropriate type

  const handleCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
    });
    if (result.assets && result.assets[0]) {
      processImage(result.assets[0]);
    }
  };

  const handleLibrary = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    });
    if (result.assets && result.assets[0]) {
      processImage(result.assets[0]);
    }
  };

  const processImage = async (asset: any) => {
    if (!asset.base64) {
      return;
    }
    setImageUri(asset.uri);
    setAnalyzing(true);
    try {
      const result = await analyzeImage(asset.base64);
      setAnalysisResult(result);
    } catch (error) {
      Alert.alert(t.common.error, t.addEntry.analysisFailed);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!analysisResult) {
      return;
    }

    // Determine values based on mode (strict vs conservative)
    // This logic mirrors the web app's `getFinalValue`
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
      date: firestore.Timestamp.now(), // Use Firestore Timestamp
      imageUrl: imageUri,
      itemName: analysisResult.itemName || 'Untitled',
      type: (analysisResult.recordType as EntryType) || 'expense',
      category: (analysisResult.category as ExpenseCategory) || 'other',
      paymentMethod: 'cash' as PaymentMethod, // Default
      usage: (analysisResult.usage as UsageCategory) || 'want',
      cost: analysisResult.cost || 0,
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
      </View>

      {analyzing && (
        <Text style={styles.status}>{t.addEntry.analyzingTitle}</Text>
      )}

      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        </View>
      )}

      {analysisResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>{analysisResult.itemName}</Text>
          <Text>Cost: ${analysisResult.cost}</Text>
          {/* Display other details */}
          <Button title={t.addEntry.saveEntry} onPress={handleSave} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  captureButton: {
    backgroundColor: '#000',
    width: 150,
    height: 150,
    borderRadius: 75,
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
    marginTop: 8,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 10,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  status: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  resultContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
