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
exports.scheduledArchiveEntries = exports.deleteAccount = exports.analyzeImage = void 0;
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
const analysisPrompt_1 = require("./prompts/analysisPrompt");
// --- 區塊 2: 初始化 ---
// 初始化 Firebase Admin
admin.initializeApp();
// Use specific database instance 'bvoy' - admin.app() is optional if using default app, but safer to include.
// However, admin.firestore(app) returns a Firestore service interface which doesn't take a second string argument for database ID in the Node SDK in the same way.
// The Admin SDK initializes the app with options. If a specific database ID is needed, it should be in the options or accessed via getFirestore(app, databaseId).
// But for "bvoy" being the default database, we just need `getFirestore()`.
// If "bvoy" is a *named* database (not default), we need `getFirestore('bvoy')`.
// The error TS2554: Expected 0-1 arguments, but got 2. suggests admin.firestore() does not take 2 args.
// Let's try to get the database correctly.
const db = admin.firestore();
try {
    // If bvoy is a named database, we might need a different initialization or access pattern.
    // However, the prompt says "bvoy" should be the *default* database or we must use it.
    // In Admin SDK, usually `admin.firestore()` connects to the default database of the project.
    // If we need to connect to a specific database:
    // const db = getFirestore(app, 'bvoy'); // This is for modular SDK, but admin uses `admin.firestore()`.
}
catch (e) {
    console.error(e);
}
//設定 v2 全域選項 (主要影響 analyzeImage)
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
exports.analyzeImage = (0, https_1.onCall)({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new https_1.HttpsError('internal', 'GEMINI_API_KEY missing.');
    const { base64Image, language } = request.data;
    if (!base64Image)
        throw new https_1.HttpsError('invalid-argument', 'Image missing.');
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const allowedLanguages = {
        'en': 'English',
        'zh-TW': 'Traditional Chinese (繁體中文)'
    };
    const lang = allowedLanguages[language] || 'English';
    const base64Data = base64Image.split(',')[1] || base64Image;
    const prompt = (0, analysisPrompt_1.getAnalysisPrompt)(lang);
    const requestParts = [{ text: prompt }, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }];
    const commonConfig = { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 };
    let responseText = null;
    let usedModel = "unknown";
    try {
        console.log("Attempting with Gemini 3.0 Flash Preview...");
        const modelV3 = genAI.getGenerativeModel({ model: "gemini-3.0-flash-preview", generationConfig: commonConfig });
        const result = await modelV3.generateContent(requestParts);
        responseText = result.response.text();
        usedModel = "gemini-3.0-flash-preview";
    }
    catch (error) {
        console.warn(`Gemini 3.0 failed. Reason: ${error.message}. Switching to fallback...`);
        try {
            console.log("Fallback attempting with Gemini 2.5 Flash...");
            const modelV25 = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: commonConfig });
            const resultFallback = await modelV25.generateContent(requestParts);
            responseText = resultFallback.response.text();
            usedModel = "gemini-2.5-flash";
        }
        catch (fallbackError) {
            console.error("Both models failed.", fallbackError);
            throw new https_1.HttpsError('internal', `AI Analysis completely failed. Error: ${fallbackError.message}`);
        }
    }
    if (!responseText)
        throw new https_1.HttpsError('internal', "Received empty response from AI models.");
    try {
        const data = JSON.parse(responseText);
        data._debug_model = usedModel;
        if (!data.isFood) {
            data.recordType = "expense";
            data.calories = { min: 0, max: 0 };
            data.macros = { protein: { min: 0, max: 0 }, carbs: { min: 0, max: 0 }, fat: { min: 0, max: 0 } };
        }
        return data;
    }
    catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new https_1.HttpsError('internal', 'Failed to parse AI response.');
    }
});
// --- 區塊 5: 刪除帳號函式 (v2) - 已修正 ---
exports.deleteAccount = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in to delete account.');
    }
    const uid = request.auth.uid;
    try {
        console.log(`Starting account deletion for user: ${uid}`);
        // 2. 刪除 Firestore 資料
        const entriesRef = db.collection('users').doc(uid).collection('entries');
        const entriesSnapshot = await entriesRef.get();
        const CHUNK_SIZE = 400;
        const chunks = [];
        for (let i = 0; i < entriesSnapshot.docs.length; i += CHUNK_SIZE) {
            chunks.push(entriesSnapshot.docs.slice(i, i + CHUNK_SIZE));
        }
        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        console.log(`Deleted entries subcollection for user: ${uid}`);
        await db.collection('users').doc(uid).delete();
        console.log(`Deleted user document for user: ${uid}`);
        // 3. 刪除 Storage 資料 (已修正)
        const bucket = admin.storage().bucket();
        const prefixesToDelete = [`users/${uid}/`, `archive/${uid}/`];
        await Promise.all(prefixesToDelete.map(async (prefix) => {
            try {
                await bucket.deleteFiles({ prefix });
                console.log(`Successfully deleted files under prefix: ${prefix} for user ${uid}`);
            }
            catch (error) {
                console.warn(`Could not delete files under prefix ${prefix}. Error: ${error}. This might be because the folder is empty.`);
            }
        }));
        console.log(`Finished attempting to delete all storage data for user: ${uid}`);
        // 4. 刪除 Firebase Auth User
        await admin.auth().deleteUser(uid);
        console.log(`Deleted Auth user: ${uid}`);
        return { success: true, message: 'Account completely deleted.' };
    }
    catch (error) {
        console.error(`Error deleting account for user ${uid}:`, error);
        throw new https_1.HttpsError('internal', `Failed to delete account: ${error.message}`);
    }
});
// --- 區塊 6: 定期封存函式 (舊版架構 - 保留原樣) ---
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
            const snapshot = await q.get();
            if (snapshot.empty) {
                functions.logger.info(`User ${userId} has no entries to archive.`);
                return;
            }
            functions.logger.info(`Found ${snapshot.size} entries to archive for user ${userId}.`);
            const CHUNK_SIZE = 400;
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
                chunks.push(snapshot.docs.slice(i, i + CHUNK_SIZE));
            }
            for (const chunk of chunks) {
                const batch = db.batch();
                const storageUploadPromises = [];
                chunk.forEach((doc) => {
                    const entry = doc.data();
                    const entryId = doc.id;
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
            }
            functions.logger.info(`Successfully archived entries for user ${userId}.`);
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