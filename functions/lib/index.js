"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const generative_ai_1 = require("@google/generative-ai");
(0, v2_1.setGlobalOptions)({ region: "us-central1" });
// 定義嚴格的 Schema (從您之前的版本移過來)
const schema = {
    description: "Combined Finance and Fitness Analysis",
    type: generative_ai_1.SchemaType.OBJECT,
    properties: {
        isFood: { type: generative_ai_1.SchemaType.BOOLEAN },
        isExpense: { type: generative_ai_1.SchemaType.BOOLEAN },
        recordType: { type: generative_ai_1.SchemaType.STRING, enum: ["combined", "expense", "diet"] },
        itemName: { type: generative_ai_1.SchemaType.STRING },
        category: { type: generative_ai_1.SchemaType.STRING, enum: ["food", "transport", "shopping", "entertainment", "bills", "other"] },
        usage: { type: generative_ai_1.SchemaType.STRING, enum: ["must", "need", "want"] },
        cost: { type: generative_ai_1.SchemaType.NUMBER, nullable: true },
        calories: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                min: { type: generative_ai_1.SchemaType.NUMBER },
                max: { type: generative_ai_1.SchemaType.NUMBER }
            },
            required: ["min", "max"]
        },
        // 如果您還需要 macros，請保留此段，否則可拿掉
        macros: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                protein: { type: generative_ai_1.SchemaType.OBJECT, properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } }, required: ["min", "max"] },
                carbs: { type: generative_ai_1.SchemaType.OBJECT, properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } }, required: ["min", "max"] },
                fat: { type: generative_ai_1.SchemaType.OBJECT, properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } }, required: ["min", "max"] }
            },
            required: ["protein", "carbs", "fat"],
            nullable: true
        },
        reasoning: { type: generative_ai_1.SchemaType.STRING }
    },
    required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage", "calories", "reasoning"]
};
exports.analyzeImage = (0, https_1.onCall)({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey)
        throw new https_1.HttpsError('internal', 'Server Error: API Key missing.');
    const { base64Image, language } = request.data;
    if (!base64Image)
        throw new https_1.HttpsError('invalid-argument', 'Image missing.');
    // 1. 定義嘗試順序：優先嘗試 2.0 (如果帳號有權限)，接著是穩定的 1.5-flash-001
    const modelsToTry = [
        "gemini-2.0-flash-exp", // 速度最快，但可能不穩定
        "gemini-1.5-flash-001", // 最推薦的穩定版本
        "gemini-1.5-flash", // 別名
        "gemini-1.5-pro" // 較貴但強大，作為最後手段
    ];
    const base64Data = base64Image.split(',')[1] || base64Image;
    const lang = language === 'zh-TW' ? "Traditional Chinese (繁體中文)" : "English";
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    let lastError = null;
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
            if (!text)
                throw new Error("Empty response");
            // 有了 Schema，通常不需要 regex 清理，但保留作為保險
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            // 成功解析就直接回傳
            return JSON.parse(jsonStr);
        }
        catch (err) {
            console.warn(`Model ${modelName} failed:`, err.message);
            lastError = err;
            // 如果是 API Key 無效，換模型也沒用，直接中斷
            if ((_a = err.message) === null || _a === void 0 ? void 0 : _a.includes("API key not valid"))
                break;
            // 如果是 404 Not Found (您的原始問題)，loop 會繼續嘗試下一個模型
        }
    }
    throw new https_1.HttpsError('internal', `Analysis failed after trying all models. Last error: ${lastError === null || lastError === void 0 ? void 0 : lastError.message}`);
});
//# sourceMappingURL=index.js.map