"use strict";
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
exports.analyzeImage = exports.scheduledArchive = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
(0, v2_1.setGlobalOptions)({ region: "us-central1" });
const ARCHIVE_THRESHOLD_MONTHS = 6;
exports.scheduledArchive = (0, scheduler_1.onSchedule)("0 0 1 * *", async (event) => {
    console.log("Running scheduled archive job");
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - ARCHIVE_THRESHOLD_MONTHS);
    const thresholdTimestamp = admin.firestore.Timestamp.fromDate(thresholdDate);
    const usersSnapshot = await db.collection("users").get();
    if (usersSnapshot.empty) {
        console.log("No users found. Exiting archive job.");
        return;
    }
    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`Archiving entries for user: ${userId}`);
        const entriesRef = db.collection("users").doc(userId).collection("entries");
        const q = entriesRef.where("date", "<", thresholdTimestamp);
        try {
            const querySnapshot = await q.get();
            if (querySnapshot.empty) {
                console.log(`No old entries to archive for user: ${userId}`);
                continue;
            }
            const batch = db.batch();
            let archiveCount = 0;
            for (const doc of querySnapshot.docs) {
                const entry = doc.data();
                const entryId = doc.id;
                const archivePath = `archive/${userId}/${entryId}.json`;
                const file = storage.bucket().file(archivePath);
                await file.save(JSON.stringify(entry), { contentType: 'application/json' });
                batch.delete(doc.ref);
                archiveCount++;
            }
            await batch.commit();
            console.log(`Successfully archived ${archiveCount} entries for user: ${userId}`);
        }
        catch (error) {
            console.error(`Failed to archive entries for user ${userId}:`, error);
        }
    }
    console.log("Finished scheduled archive job.");
});
exports.analyzeImage = (0, https_1.onCall)({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login required.');
    }
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'GEMINI_API_KEY missing.');
    }
    const { base64Image, language } = request.data;
    if (!base64Image) {
        throw new https_1.HttpsError('invalid-argument', 'Image missing.');
    }
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
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        const base64Data = base64Image.split(',')[1] || base64Image;
        const lang = language === 'zh-TW' ? "Traditional Chinese (繁體中文)" : "English";
        const prompt = `Analyze this image for a tracker app.
    CRITICAL RULES:
    1. If the item is NOT food/drink (e.g. receipt for gas, clothing, tools), set "isFood" to false AND "recordType" to "expense".
    2. For "expense" type, set all calorie and macro values (min and max) to 0.
    3. Categorize non-food items into transport, shopping, entertainment, bills, or other.
    4. Language for text: ${lang}.`;
        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);
        const text = result.response.text();
        if (!text)
            throw new Error("Empty AI response");
        const data = JSON.parse(text);
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
        throw new https_1.HttpsError('internal', `Analysis failed: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map