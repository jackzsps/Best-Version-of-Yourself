import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 設定 Cloud Functions 的全域選項
setGlobalOptions({ region: "us-central1" });

export const analyzeImage = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  // 1. 驗證使用者是否登入
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required.');
  }

  // 2. 取得 API Key
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new HttpsError('internal', 'GEMINI_API_KEY missing.');
  }

  // 3. 取得前端傳來的資料
  const { base64Image, language } = request.data;
  if (!base64Image) {
    throw new HttpsError('invalid-argument', 'Image missing.');
  }

  // 4. 定義輸出的 JSON Schema (結構化輸出)
  const schema: any = {
    type: SchemaType.OBJECT,
    properties: {
      isFood: { type: SchemaType.BOOLEAN },
      isExpense: { type: SchemaType.BOOLEAN },
      recordType: { type: SchemaType.STRING, enum: ["combined", "expense", "diet"] },
      itemName: { type: SchemaType.STRING },
      category: { 
        type: SchemaType.STRING, 
        enum: ["food", "transport", "shopping", "entertainment", "bills", "other"] 
      },
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
      macros: {
        type: SchemaType.OBJECT,
        properties: {
          protein: { 
            type: SchemaType.OBJECT, 
            properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, 
            required: ["min", "max"] 
          },
          carbs: { 
            type: SchemaType.OBJECT, 
            properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, 
            required: ["min", "max"] 
          },
          fat: { 
            type: SchemaType.OBJECT, 
            properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, 
            required: ["min", "max"] 
          }
        },
        required: ["protein", "carbs", "fat"]
      },
      reasoning: { type: SchemaType.STRING }
    },
    required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage", "calories", "reasoning"]
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- 修正處：更新為最新的穩定版模型 ---
    // gemini-1.5-flash 已棄用
    // 使用 gemini-2.5-flash (2025/2026 穩定版)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    // 處理 Base64 圖片字串 (移除 data:image/jpeg;base64, 前綴)
    const base64Data = base64Image.split(',')[1] || base64Image;
    const lang = language === 'zh-TW' ? "Traditional Chinese (繁體中文)" : "English";

    // 強化提示詞：強調非食物的處理
    const prompt = `Analyze this image for a tracker app.
    CRITICAL RULES:
    1. If the item is NOT food/drink (e.g. receipt for gas, clothing, tools), set "isFood" to false AND "recordType" to "expense".
    2. For "expense" type, set all calorie and macro values (min and max) to 0.
    3. Categorize non-food items into transport, shopping, entertainment, bills, or other.
    4. Language for text: ${lang}.`;

    // 呼叫 Gemini API
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    const data = JSON.parse(text);
    
    // 二次保險：如果 AI 判斷不是食物，強制在後端清理數值，避免前端顯示錯誤
    if (!data.isFood) {
      data.recordType = "expense";
      data.calories = { min: 0, max: 0 };
      data.macros = {
        protein: { min: 0, max: 0 },
        carbs: { min: 0, max: 0 },
        fat: { min: 0, max: 0 }
      };
    }

    return data;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    // 拋出明確的錯誤訊息給前端
    throw new HttpsError('internal', `Analysis failed: ${error.message}`);
  }
});