
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

setGlobalOptions({ region: "us-central1" });

const ARCHIVE_THRESHOLD_MONTHS = 6;

export const scheduledArchive = onSchedule("0 0 1 * *", async (event) => {
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

    } catch (error) {
        console.error(`Failed to archive entries for user ${userId}:`, error);
    }
  }
  console.log("Finished scheduled archive job.");
});

export const analyzeImage = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required.');
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new HttpsError('internal', 'GEMINI_API_KEY missing.');
  }

  const { base64Image, language } = request.data;
  if (!base64Image) {
    throw new HttpsError('invalid-argument', 'Image missing.');
  }

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
    if (!text) throw new Error("Empty AI response");

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

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new HttpsError('internal', `Analysis failed: ${error.message}`);
  }
});
