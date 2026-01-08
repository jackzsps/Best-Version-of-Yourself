"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const generative_ai_1 = require("@google/generative-ai");
// 設定 Cloud Functions 的全域選項
(0, v2_1.setGlobalOptions)({ region: "us-central1" });
exports.analyzeImage = (0, https_1.onCall)({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    // 1. 驗證使用者是否登入
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    }
    // 2. 取得 API Key
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'GEMINI_API_KEY missing.');
    }
    // 3. 取得前端傳來的資料
    const { base64Image, language } = request.data;
    if (!base64Image) {
        throw new https_1.HttpsError('invalid-argument', 'Image missing.');
    }
    // 4. 定義輸出的 JSON Schema (結構化輸出)
    const schema = {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            isFood: { type: generative_ai_1.SchemaType.BOOLEAN },
            isExpense: { type: generative_ai_1.SchemaType.BOOLEAN },
            recordType: { type: generative_ai_1.SchemaType.STRING, enum: ["combined", "expense", "diet"] },
            itemName: { type: generative_ai_1.SchemaType.STRING },
            category: {
                type: generative_ai_1.SchemaType.STRING,
                enum: ["food", "transport", "shopping", "entertainment", "bills", "other"]
            },
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
            macros: {
                type: generative_ai_1.SchemaType.OBJECT,
                properties: {
                    protein: {
                        type: generative_ai_1.SchemaType.OBJECT,
                        properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } },
                        required: ["min", "max"]
                    },
                    carbs: {
                        type: generative_ai_1.SchemaType.OBJECT,
                        properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } },
                        required: ["min", "max"]
                    },
                    fat: {
                        type: generative_ai_1.SchemaType.OBJECT,
                        properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } },
                        required: ["min", "max"]
                    }
                },
                required: ["protein", "carbs", "fat"]
            },
            reasoning: { type: generative_ai_1.SchemaType.STRING }
        },
        required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage", "calories", "reasoning"]
    };
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
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
        if (!text)
            throw new Error("Empty AI response");
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
    }
    catch (error) {
        console.error("Gemini Error:", error);
        // 拋出明確的錯誤訊息給前端
        throw new https_1.HttpsError('internal', `Analysis failed: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map