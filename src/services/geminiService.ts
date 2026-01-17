import { httpsCallable } from "firebase/functions";
import { functions } from "../utils/firebase"; 
import { AnalysisResult, Language } from "../types";
import { toast } from "../store/ToastContext";

export const analyzeImage = async (base64Image: string, language: Language = 'en'): Promise<AnalysisResult> => {
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
    const msg = error.message || "Unknown analysis error";
    // 使用 Toast 通知使用者
    toast.error(`AI Analysis Failed: ${msg}`);
    throw new Error(`AI Analysis Error: ${msg}`);
  }
};
