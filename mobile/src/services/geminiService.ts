// Placeholder for Gemini Service
// This mimics the web service but adapted for RN if necessary
import { firebase } from '@react-native-firebase/functions';
import { AnalysisResult, Language } from '../types';
import NetInfo from '@react-native-community/netinfo';

// 注意：這裡不直接使用 useToast hook，因為這是一個純函數服務。
// 我們可以讓函數拋出特定錯誤，由呼叫端 (UI Component) 捕捉並顯示 Toast。
// 或者，如果專案架構允許，可以傳入 toast 實例作為參數，但通常保持 Service 純淨較好。

export const analyzeImage = async (
  base64Image: string,
  language: Language = 'en',
): Promise<AnalysisResult> => {
  // 1. 網路狀態預檢查 (Parity with Web)
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    const error: any = new Error('No internet connection. Image will be saved locally.');
    error.isNetworkError = true; // 標記為網路錯誤，方便 UI 層辨識
    throw error;
  }

  try {
    const analyzeImageFunction = firebase.app().functions('asia-east1').httpsCallable('analyzeImage');
    const result = await analyzeImageFunction({ base64Image, language });
    return result.data as AnalysisResult;
  } catch (error: any) {
    console.error('ANALYSIS CALL ERROR:', error);

    // 2. 錯誤分類 (Parity with Web)
    const isNetworkError =
      error.code === 'functions/unavailable' ||
      error.code === 'unavailable' ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('offline');

    if (isNetworkError) {
      const handledError: any = new Error('Network unavailable. Image will be saved locally.');
      handledError.isNetworkError = true;
      throw handledError;
    }

    throw new Error(error.message || 'Unknown analysis error');
  }
};
