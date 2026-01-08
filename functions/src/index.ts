import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

setGlobalOptions({ region: "us-central1" });

export const analyzeImage = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) throw new HttpsError('internal', 'GEMINI_API_KEY is missing.');

  const { base64Image, language } = request.data;
  if (!base64Image) throw new HttpsError('invalid-argument', 'Image missing.');

  // 定義嚴格的 Schema
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: schema // 強制輸出為這個結構
      }
    });

    const base64Data = base64Image.split(',')[1] || base64Image;
    const lang = language === 'zh-TW' ? "Traditional Chinese" : "English";
    const prompt = `Analyze this image. Language: ${lang}. Focus on accuracy.`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    return JSON.parse(text);

  } catch (error: any) {
    console.error("Gemini Schema Error:", error);
    throw new HttpsError('internal', `Analysis failed: ${error.message}`);
  }
});
