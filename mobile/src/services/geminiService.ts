// Placeholder for Gemini Service
// This mimics the web service but adapted for RN if necessary
import functions from '@react-native-firebase/functions';
import { AnalysisResult, Language } from '../types';

export const analyzeImage = async (
  base64Image: string,
  language: Language = 'en',
): Promise<AnalysisResult> => {
  try {
    const analyzeImageFunction = functions().httpsCallable('analyzeImage');
    const result = await analyzeImageFunction({ base64Image, language });
    return result.data as AnalysisResult;
  } catch (error: any) {
    console.error('ANALYSIS CALL ERROR:', error);
    throw new Error(error.message || 'Unknown analysis error');
  }
};
