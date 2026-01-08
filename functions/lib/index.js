"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const generative_ai_1 = require("@google/generative-ai");
(0, v2_1.setGlobalOptions)({ region: "us-central1" });
exports.analyzeImage = (0, https_1.onCall)({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey)
        throw new https_1.HttpsError('internal', 'GEMINI_API_KEY is missing.');
    const { base64Image, language } = request.data;
    if (!base64Image)
        throw new https_1.HttpsError('invalid-argument', 'Image missing.');
    // 定義嚴格的 Schema
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
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
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
        if (!text)
            throw new Error("Empty AI response");
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Gemini Schema Error:", error);
        throw new https_1.HttpsError('internal', `Analysis failed: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map