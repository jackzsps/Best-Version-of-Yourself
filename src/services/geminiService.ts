import { httpsCallable } from "firebase/functions";
import { functions } from "../utils/firebase"; 
import { AnalysisResult, Language } from "../types";
import { toast } from "../store/ToastContext";

export const analyzeImage = async (base64Image: string, language: Language = 'en'): Promise<AnalysisResult> => {
  // 檢查網路狀態
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const msg = "目前無網路連線，將儲存於本地稍後上傳";
      toast.info(msg);
      const error: any = new Error(msg);
      error.isHandled = true;
      throw error;
  }

  try {
    // 修正：使用 Modular SDK 的呼叫方式
    const analyzeImageFunction = httpsCallable<
      { base64Image: string; language: string }, 
      AnalysisResult
    >(functions, 'analyzeImage');
    
    console.log("Calling Cloud Function 'analyzeImage' (Modular)...");
    const result = await analyzeImageFunction({ base64Image, language });
    
    return result.data;

  } catch (error: any) {
    console.error("ANALYSIS CALL ERROR:", error);
    
    // 判斷是否為網路相關錯誤
    const isNetworkError = 
        error.code === 'functions/unavailable' || 
        error.code === 'unavailable' ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('offline') ||
        error.message?.toLowerCase().includes('failed to fetch');

    if (isNetworkError) {
        const msg = "目前無網路連線，將儲存於本地稍後上傳";
        toast.info(msg);
        const handledError: any = new Error(msg);
        handledError.isHandled = true;
        throw handledError;
    }

    const msg = error.message || "Unknown analysis error";
    // 使用 Toast 通知使用者
    toast.error(`AI Analysis Failed: ${msg}`);
    throw new Error(`AI Analysis Error: ${msg}`);
  }
};
