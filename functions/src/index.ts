import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

setGlobalOptions({ region: "us-central1" });

// 定義嚴格的 Schema (從您之前的版本移過來)
const schema: any = {
  description: "Combined Finance and Fitness Analysis",
  type: SchemaType.OBJECT,
  properties: {
    isFood: { type: SchemaType.BOOLEAN },
    isExpense: { type: SchemaType.BOOLEAN },
    recordType: { type: SchemaType.STRING, enum: ["combined", "expense", "diet"] },
    itemName: { type: SchemaType.STRING },
    category: { type: SchemaType.STRING, enum: ["food", "transport", "shopping", "entertainment", "bills", "other"] },
    usage: { type: SchemaType.STRING, enum: ["must", "need", "want"] },
    cost: { type: SchemaType.NUMBER, nullable: true },
    calories: {
      type: SchemaType.OBJECT,
      properties: {
        min: { type: SchemaType.NUMBER },
        max: { type: SchemaType.NUMBER }
      },
      required: ["min", "max"]
    },
    // 如果您還需要 macros，請保留此段，否則可拿掉
    macros: {
      type: SchemaType.OBJECT,
      properties: {
        protein: { type: SchemaType.OBJECT, properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, required: ["min", "max"] },
        carbs: { type: SchemaType.OBJECT, properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, required: ["min", "max"] },
        fat: { type: SchemaType.OBJECT, properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, required: ["min", "max"] }
      },
      required: ["protein", "carbs", "fat"],
      nullable: true
    },
    reasoning: { type: SchemaType.STRING }
  },
  required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage", "calories", "reasoning"]
};

export const analyzeImage = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) throw new HttpsError('internal', 'Server Error: API Key missing.');

  const { base64Image, language } = request.data;
  if (!base64Image) throw new HttpsError('invalid-argument', 'Image missing.');

  // 1. 定義嘗試順序：優先嘗試 2.0 (如果帳號有權限)，接著是穩定的 1.5-flash-001
  const modelsToTry = [
    "gemini-2.0-flash-exp",   // 速度最快，但可能不穩定
    "gemini-1.5-flash-001",   // 最推薦的穩定版本
    "gemini-1.5-flash",       // 別名
    "gemini-1.5-pro"          // 較貴但強大，作為最後手段
  ];

  const base64Data = base64Image.split(',')[1] || base64Image;
  const lang = language === 'zh-TW' ? "Traditional Chinese (繁體中文)" : "English";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: schema // 關鍵：加回這裡以確保輸出格式穩定
        }
      });
      
      const prompt = `Analyze this image. Language: ${lang}. 
      Identify if it is food or a receipt. 
      Estimate costs and calories accurately.`;

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]);

      const text = result.response.text();
      if (!text) throw new Error("Empty response");

      // 有了 Schema，通常不需要 regex 清理，但保留作為保險
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      // 成功解析就直接回傳
      return JSON.parse(jsonStr);

    } catch (err: any) {
      console.warn(`Model ${modelName} failed:`, err.message);
      lastError = err;
      
      // 如果是 API Key 無效，換模型也沒用，直接中斷
      if (err.message?.includes("API key not valid")) break;
      // 如果是 404 Not Found (您的原始問題)，loop 會繼續嘗試下一個模型
    }
  }

  throw new HttpsError('internal', `Analysis failed after trying all models. Last error: ${lastError?.message}`);
});