/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// --- 區塊 1: 引入依賴 ---
// 新版 Functions (v2) - 用於 AI 分析
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

// 舊版 Functions (v1) - 用於排程 (Schedule 觸發目前在 v1 支援度較好)
import * as functions from "firebase-functions/v1";

// Firebase Admin SDK - 用於資料庫與儲存操作
import * as admin from "firebase-admin";

// Google AI SDK - 用於呼叫 Gemini
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getAnalysisPrompt } from "./prompts/analysisPrompt";

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
} catch (e) {
    console.error(e);
}

//設定 v2 全域選項 (主要影響 analyzeImage)
setGlobalOptions({ region: "asia-east1" });

// --- 區塊 3: 定義 AI 分析用的 Schema ---
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    isFood: { type: SchemaType.BOOLEAN },
    isExpense: { type: SchemaType.BOOLEAN },
    recordType: { type: SchemaType.STRING, enum: ["combined", "expense", "diet"] },
    itemName: { type: SchemaType.STRING },
    category: { type: SchemaType.STRING, enum: ["food", "transport", "shopping", "entertainment", "bills", "other"] },
    paymentMethod: { type: SchemaType.STRING, enum: ["cash", "card", "mobile"], nullable: true },
    usage: { type: SchemaType.STRING, enum: ["must", "need", "want"] },
    cost: { type: SchemaType.NUMBER, nullable: true },
    calories: {
      type: SchemaType.OBJECT,
      properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } },
      required: ["min", "max"]
    },
    macros: {
      type: SchemaType.OBJECT,
      properties: {
        protein: { type: SchemaType.OBJECT, properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, required: ["min", "max"] },
        carbs: { type: SchemaType.OBJECT, properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, required: ["min", "max"] },
        fat: { type: SchemaType.OBJECT, properties: { min: { type: SchemaType.NUMBER }, max: { type: SchemaType.NUMBER } }, required: ["min", "max"] }
      },
      required: ["protein", "carbs", "fat"]
    },
    reasoning: { type: SchemaType.STRING }
  },
  required: ["isFood", "isExpense", "recordType", "itemName", "category", "usage", "calories", "macros", "reasoning"]
};

// --- 區塊 4: AI 圖片分析函式 (新版架構) ---
export const analyzeImage = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpsError('internal', 'GEMINI_API_KEY missing.');
  const { base64Image, language } = request.data;
  if (!base64Image) throw new HttpsError('invalid-argument', 'Image missing.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const allowedLanguages: { [key: string]: string } = {
    'en': 'English',
    'zh-TW': 'Traditional Chinese (繁體中文)'
  };
  const lang = allowedLanguages[language] || 'English';
  const base64Data = base64Image.split(',')[1] || base64Image;
  const prompt = getAnalysisPrompt(lang);
  const requestParts = [{ text: prompt }, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }];
  const commonConfig = { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 };

  let responseText: string | null = null;
  let usedModel = "unknown";

  try {
    console.log("Attempting with Gemini 3.0 Flash Preview...");
    const modelV3 = genAI.getGenerativeModel({ model: "gemini-3.0-flash-preview", generationConfig: commonConfig });
    const result = await modelV3.generateContent(requestParts);
    responseText = result.response.text();
    usedModel = "gemini-3.0-flash-preview";
  } catch (error: any) {
    console.warn(`Gemini 3.0 failed. Reason: ${error.message}. Switching to fallback...`);
    try {
      console.log("Fallback attempting with Gemini 2.5 Flash...");
      const modelV25 = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: commonConfig });
      const resultFallback = await modelV25.generateContent(requestParts);
      responseText = resultFallback.response.text();
      usedModel = "gemini-2.5-flash";
    } catch (fallbackError: any) {
      console.error("Both models failed.", fallbackError);
      throw new HttpsError('internal', `AI Analysis completely failed. Error: ${fallbackError.message}`);
    }
  }

  if (!responseText) throw new HttpsError('internal', "Received empty response from AI models.");

  try {
    const data = JSON.parse(responseText);
    data._debug_model = usedModel;
    if (!data.isFood) {
      data.recordType = "expense";
      data.calories = { min: 0, max: 0 };
      data.macros = { protein: { min: 0, max: 0 }, carbs: { min: 0, max: 0 }, fat: { min: 0, max: 0 } };
    }
    return data;
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError);
    throw new HttpsError('internal', 'Failed to parse AI response.');
  }
});

// --- 區塊 5: 刪除帳號函式 (v2) - 已修正 ---
export const deleteAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in to delete account.');
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
      } catch (error) {
        console.warn(`Could not delete files under prefix ${prefix}. Error: ${error}. This might be because the folder is empty.`);
      }
    }));
    console.log(`Finished attempting to delete all storage data for user: ${uid}`);

    // 4. 刪除 Firebase Auth User
    await admin.auth().deleteUser(uid);
    console.log(`Deleted Auth user: ${uid}`);

    return { success: true, message: 'Account completely deleted.' };

  } catch (error: any) {
    console.error(`Error deleting account for user ${uid}:`, error);
    throw new HttpsError('internal', `Failed to delete account: ${error.message}`);
  }
});

// --- 區塊 6: 定期封存函式 (舊版架構 - 保留原樣) ---
export const scheduledArchiveEntries = functions
  .region("asia-east1")
  .pubsub.schedule("0 0 1 * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    functions.logger.info("Starting scheduled archive job.", {structuredData: true});
    
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
            const storageUploadPromises: Promise<any>[] = [];

            chunk.forEach((doc) => {
              const entry = doc.data();
              const entryId = doc.id;

              if (!entry.date || !(entry.date instanceof admin.firestore.Timestamp)) {
                  functions.logger.warn(`Entry ${entryId} for user ${userId} has invalid date, skipping.`);
                  return;
              }

              const archivePath = `archive/${userId}/${entryId}.json`;
              const file = admin.storage().bucket().file(archivePath);
              storageUploadPromises.push(
                  file.save(JSON.stringify(entry), {contentType: "application/json"})
              );
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
    } catch (error) {
      functions.logger.error("Error during scheduled archive job:", error);
      throw error;
    }
  });
