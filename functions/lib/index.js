"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledArchiveEntries = exports.analyzeImage = void 0;
// --- 區塊 1: 引入依賴 ---
// 新版 Functions (v2) - 用於 AI 分析
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
// 舊版 Functions (v1) - 用於排程 (Schedule 觸發目前在 v1 支援度較好)
const functions = __importStar(require("firebase-functions/v1"));
// Firebase Admin SDK - 用於資料庫與儲存操作
const admin = __importStar(require("firebase-admin"));
// Google AI SDK - 用於呼叫 Gemini
const generative_ai_1 = require("@google/generative-ai");
// --- 區塊 2: 初始化 ---
// 初始化 Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// 設定 v2 全域選項 (主要影響 analyzeImage)
(0, v2_1.setGlobalOptions)({ region: "asia-east1" });
// --- 區塊 3: 定義 AI 分析用的 Schema ---
const analysisSchema = {
    type: generative_ai_1.SchemaType.OBJECT,
    properties: {
        isFood: { type: generative_ai_1.SchemaType.BOOLEAN },
        isExpense: { type: generative_ai_1.SchemaType.BOOLEAN },
        recordType: { type: generative_ai_1.SchemaType.STRING, enum: ["combined", "expense", "diet"] },
        itemName: { type: generative_ai_1.SchemaType.STRING },
        category: { type: generative_ai_1.SchemaType.STRING, enum: ["food", "transport", "shopping", "entertainment", "bills", "other"] },
        paymentMethod: { type: generative_ai_1.SchemaType.STRING, enum: ["cash", "card", "mobile"], nullable: true },
        usage: { type: generative_ai_1.SchemaType.STRING, enum: ["must", "need", "want"] },
        cost: { type: generative_ai_1.SchemaType.NUMBER, nullable: true },
        calories: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } },
            required: ["min", "max"]
        },
        macros: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                protein: { type: generative_ai_1.SchemaType.OBJECT, properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } }, required: ["min", "max"] },
                carbs: { type: generative_ai_1.SchemaType.OBJECT, properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } }, required: ["min", "max"] },
                fat: { type: generative_ai_1.SchemaType.OBJECT, properties: { min: { type: generative_ai_1.SchemaType.NUMBER }, max: { type: generative_ai_1.SchemaType.NUMBER } }, required: ["min", "max"] }
            },
            required: ["protein", "carbs", "fat"]
        },
        reasoning: { type: generative_ai_1.SchemaType.STRING }
    },
    required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage", "calories", "macros", "reasoning"]
};
// --- 區塊 4: AI 圖片分析函式 (新版架構) ---
// 採用 Gen 2, Secrets 管理, Schema 輸出, 以及 Gemini 3.0 -> 2.5 降級機制
exports.analyzeImage = (0, https_1.onCall)({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    // 1. 基礎驗證
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    // 安全地獲取 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new https_1.HttpsError('internal', 'GEMINI_API_KEY missing.');
    const { base64Image, language } = request.data;
    if (!base64Image)
        throw new https_1.HttpsError('invalid-argument', 'Image missing.');
    // 2. 準備 AI 參數
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const lang = language === 'zh-TW' ? "Traditional Chinese (繁體中文)" : "English";
    const base64Data = base64Image.split(',')[1] || base64Image;
    const prompt = `Analyze this image for a combined finance and fitness tracking app.
    CRITICAL RULES:
    
    1. DETERMINE RECORD TYPE ('recordType'):
      - 'expense': Non-food items, receipts (groceries/goods), bills. (User bought it but not eating it now).
      - 'diet': Plated food without prices, home-cooked meals, leftovers. (User is eating but paid earlier).
      - 'combined': Restaurant meals, cafe items, food with visible price tags. (User is paying and eating).

    2. CATEGORIZE:
      - If food/drink, categorize as 'food'.
      - If not food/drink, categorize into transport, shopping, entertainment, bills, or other.
       

    3. DATA CLEANUP:
       - If 'recordType' is 'expense' (and not food ingredients), set all calorie and macro values (min/max) to 0.

    4. [CRITICAL] DATA CONSISTENCY (MATH CHECK):
       - Estimate macros (Protein, Carbs, Fat) first.
       - Then, CALCULATE calories based on macros: Calories ≈ (Protein * 4) + (Carbs * 4) + (Fat * 9).
       - Ensure the returned 'calories' range matches this calculation. Do not output conflicting numbers.

    5. LANGUAGE:
       - Language for text: ${lang}.

    6. [CRITICAL] FILL THE "reasoning" FIELD:
       - You MUST provide comment (max 30 words) in ${lang}.
       - Tone: Warm, encouraging, and helpful .Use Emojis if appropriate.
       - If it's food/diet: Give a quick nutritional tip or a positive comment (e.g., "Great protein source!", "Looks tasty!").
       - If it's an expense: Briefly state the item's purpose (e.g., "Monthly utility bill", "Grocery run").
       - If unsure: Describe what you see.`;
    const requestParts = [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ];
    const commonConfig = {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
    };
    // --- 核心邏輯：雙模型切換 (Retry Pattern) ---
    let responseText = null;
    let usedModel = "unknown";
    try {
        // 優先嘗試：Gemini 3.0 Flash Preview (冒險版)
        console.log("Attempting with Gemini 3.0 Flash Preview...");
        const modelV3 = genAI.getGenerativeModel({
            model: "gemini-3.0-flash-preview",
            generationConfig: commonConfig
        });
        const result = await modelV3.generateContent(requestParts);
        responseText = result.response.text();
        usedModel = "gemini-3.0-flash-preview";
    }
    catch (error) {
        // 捕捉錯誤並降級
        console.warn(`Gemini 3.0 failed. Reason: ${error.message}. Switching to fallback...`);
        try {
            // 備案嘗試：Gemini 2.5 Flash (穩定版)
            console.log("Fallback attempting with Gemini 2.5 Flash...");
            const modelV25 = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: commonConfig
            });
            const resultFallback = await modelV25.generateContent(requestParts);
            responseText = resultFallback.response.text();
            usedModel = "gemini-2.5-flash";
        }
        catch (fallbackError) {
            console.error("Both models failed.", fallbackError);
            throw new https_1.HttpsError('internal', `AI Analysis completely failed. Error: ${fallbackError.message}`);
        }
    }
    if (!responseText) {
        throw new https_1.HttpsError('internal', "Received empty response from AI models.");
    }
    // 3. 解析與後處理
    try {
        const data = JSON.parse(responseText);
        // 注入除錯資訊
        data._debug_model = usedModel;
        // 二次保險：強制清理非食物數據
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
    catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new https_1.HttpsError('internal', 'Failed to parse AI response.');
    }
});
// --- 區塊 5: 定期封存函式 (舊版架構 - 保留原樣) ---
// 使用 functions.pubsub (v1) 在 asia-east1 運行
exports.scheduledArchiveEntries = functions
    .region("asia-east1")
    .pubsub.schedule("0 0 1 * *")
    .timeZone("UTC")
    .onRun(async (context) => {
    functions.logger.info("Starting scheduled archive job.", { structuredData: true });
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thresholdTimestamp = admin.firestore.Timestamp.fromDate(sixMonthsAgo);
    try {
        const usersSnapshot = await db.collection("users").get();
        if (usersSnapshot.empty) {
            functions.logger.info("No users found, ending archive job.");
            return null;
        }
        const archivePromises = usersSnapshot.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            const entriesRef = db.collection("users").doc(userId).collection("entries");
            const q = entriesRef.where("date", "<", thresholdTimestamp);
            const entriesToArchive = await q.get();
            if (entriesToArchive.empty) {
                functions.logger.info(`User ${userId} has no entries to archive.`);
                return;
            }
            functions.logger.info(`Found ${entriesToArchive.size} entries to archive for user ${userId}.`);
            const batch = db.batch();
            const storageUploadPromises = [];
            entriesToArchive.forEach((doc) => {
                const entry = doc.data();
                const entryId = doc.id;
                // 檢查時間戳格式
                if (!entry.date || !(entry.date instanceof admin.firestore.Timestamp)) {
                    functions.logger.warn(`Entry ${entryId} for user ${userId} has invalid date, skipping.`);
                    return;
                }
                const archivePath = `archive/${userId}/${entryId}.json`;
                const file = admin.storage().bucket().file(archivePath);
                storageUploadPromises.push(file.save(JSON.stringify(entry), { contentType: "application/json" }));
                batch.delete(doc.ref);
            });
            await Promise.all(storageUploadPromises);
            await batch.commit();
            functions.logger.info(`Successfully archived ${storageUploadPromises.length} entries for user ${userId}.`);
        });
        await Promise.all(archivePromises);
        functions.logger.info("Scheduled archive job completed successfully.");
        return null;
    }
    catch (error) {
        functions.logger.error("Error during scheduled archive job:", error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map