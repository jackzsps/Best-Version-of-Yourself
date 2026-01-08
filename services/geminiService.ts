import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Language } from "../types";

// Helper to strip "data:image/..." prefix
const stripBase64Prefix = (base64: string) => {
  return base64.replace(/^data:image\/\w+;base64,/, "");
};

export const analyzeImage = async (base64Image: string, language: Language = 'en'): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing. Please set it in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const rangeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      min: { type: Type.NUMBER, description: "Minimum estimated value" },
      max: { type: Type.NUMBER, description: "Maximum estimated value" },
    },
    required: ["min", "max"],
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isFood: { type: Type.BOOLEAN, description: "True if the image contains food or a menu." },
      isExpense: { type: Type.BOOLEAN, description: "True if the image looks like a receipt or product with price." },
      recordType: {
        type: Type.STRING,
        enum: ["combined", "expense", "diet"],
        description: "Inferred record type: 'expense' (groceries, receipts, non-food), 'diet' (plated food at home), 'combined' (restaurant meals)."
      },
      itemName: { type: Type.STRING, description: "A short, descriptive name of the item." },
      category: { 
        type: Type.STRING, 
        enum: ["food", "transport", "shopping", "entertainment", "bills", "other"],
        description: "The most likely expense category." 
      },
      usage: {
        type: Type.STRING,
        enum: ["must", "need", "want"],
        description: "Classification of necessity."
      },
      cost: { type: Type.NUMBER, description: "The cost if visible on a receipt/tag, otherwise null." },
      calories: { ...rangeSchema, description: "Estimated range of calories. If not food, return 0 for min/max." },
      macros: {
        type: Type.OBJECT,
        properties: {
          protein: { ...rangeSchema, description: "Protein in grams" },
          carbs: { ...rangeSchema, description: "Carbs in grams" },
          fat: { ...rangeSchema, description: "Fat in grams" },
        },
        required: ["protein", "carbs", "fat"],
        nullable: true, 
      },
      reasoning: { type: Type.STRING, description: "Brief explanation of how values were estimated." }
    },
    required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage"],
  };

  const cleanBase64 = stripBase64Prefix(base64Image);
  
  // Custom instruction based on language
  const languageInstruction = language === 'zh-TW' 
    ? "IMPORTANT: Provide the 'itemName' and 'reasoning' fields in Traditional Chinese (繁體中文)." 
    : "Provide the 'itemName' and 'reasoning' fields in English.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this image for a combined finance and fitness tracking app.
            
            1. DETERMINE RECORD TYPE ('recordType'):
               - 'expense': Raw ingredients (groceries), receipts, non-food items, bills. (User bought it but might not eat it now).
               - 'diet': Plated food without prices, home-cooked meals, leftovers. (User is eating but paid earlier).
               - 'combined': Restaurant meals, cafe items, food with visible price tags. (User is paying and eating).

            2. Categorize the expense: 'food', 'transport', 'shopping', 'entertainment', 'bills', 'other'.
            
            3. Determine the 'usage' (necessity): 'must', 'need', 'want'.
            
            4. For nutrition (if food): provide a REALISTIC range (min/max).
            
            5. For cost: look for clear price tags or receipt totals.
            
            ${languageInstruction}
            Return strictly JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are an expert nutritionist and accountant helper.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};