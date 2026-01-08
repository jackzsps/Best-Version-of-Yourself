import { httpsCallable } from "firebase/functions";
import { functions } from "../src/utils/firebase"; 
import { AnalysisResult, Language } from "../types";

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
    throw new Error(`AI Analysis Error: ${msg}`);
  }
};
