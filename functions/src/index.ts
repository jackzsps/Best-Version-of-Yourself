
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {VertexAI} from "@google-cloud/vertexai";

// Initialize Firebase Admin and Vertex AI
initializeApp();
const db = getFirestore();

// Initialize VertexAI
const vertexAI = new VertexAI({project: "best-ver-of-yourself-080-b2069", location: "us-central1"});

const generativeModel = vertexAI.getGenerativeModel({
  model: "gemini-1.0-pro-vision-001",
});

/**
 * A callable Cloud Function that analyzes an image using Gemini 1.0 Pro Vision.
 *
 * @param {object} data - The data object containing the base64 encoded image.
 * @param {string} data.base64Image - The base64 encoded image string.
 * @param {string} data.language - The user's preferred language (e.g., 'en', 'zh-TW').
 * @returns {Promise<object>} A promise that resolves with the analysis result.
 */
export const analyzeImage = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    // 1. Validate input
    if (!data.base64Image) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'base64Image' containing the image data to analyze."
      );
    }

    // 2. Define valid categories and usage from the frontend translations
    const validCategories = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
    const validUsage = ['must', 'need', 'want'];
    const language = data.language === "zh-TW" ? "Traditional Chinese" : "English";

    // 3. Construct the prompt for the generative model
    const prompt = `
      You are an expert financial and dietary assistant.
      Analyze the provided image and respond ONLY with a valid, parsable JSON object.
      Do not include the JSON markdown syntax ('''json ... ''').

      The user's preferred language is ${language}. Your "reasoning" field MUST be in ${language}.
      All other fields must follow the specified format.

      Based on the image, identify the item, estimate its cost, calories, and macronutrients.
      The result must conform to the following JSON structure:

      {
        "itemName": "string (in ${language})",
        "recordType": "string, one of ['expense', 'diet', 'combined']",
        "category": "string, MUST be one of [${validCategories.join(", ")}]",
        "usage": "string, MUST be one of [${validUsage.join(", ")}]",
        "cost": "number | null",
        "calories": { "min": number, "max": number } | null,
        "macros": {
          "protein": { "min": number, "max": number },
          "carbs": { "min": number, "max": number },
          "fat": { "min": number, "max": number }
        } | null,
        "reasoning": "string (in ${language}, your detailed analysis)"
      }

      RULES:
      - If it's a food item, estimate calories and macros. Otherwise, set them to null.
      - If it's a receipt or shows a price, estimate the cost. Otherwise, set cost to null.
      - If it's clearly a food/drink, set recordType to 'diet' (or 'combined' if a price is visible).
      - If it's a non-food item or a bill/receipt, set recordType to 'expense'.
      - For ranges (calories/macros), provide a reasonable min and max. If you have a single estimate, set min and max to the same value.
      - CRITICAL: The "category" and "usage" fields MUST strictly be chosen from the provided lists. Do not invent new ones.
      - If the image contains no recognizable item, product, or receipt, return a JSON object with all fields set to null.
    `;

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: data.base64Image.replace("data:image/jpeg;base64,", ""),
      },
    };

    // 4. Call the Vertex AI model
    try {
      logger.info("Calling Vertex AI Gemini model...");
      const request = {
        contents: [{role: "user", parts: [{text: prompt}, imagePart]}],
      };
      const response = await generativeModel.generateContent(request);

      // Safely access the response content using optional chaining
      const content = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        logger.error("Invalid or empty response from Gemini model", { response });
        throw new Error("Empty or invalid response from Gemini model.");
      }

      logger.info("Gemini response received:", content);
      return JSON.parse(content);
    } catch (error) {
      logger.error("Error calling Vertex AI or parsing response:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to analyze image with AI."
      );
    }
  });


/**
 * A scheduled function that archives old entries.
 * Runs on the 1st of every month at midnight UTC.
 */
export const scheduledArchiveEntries = functions
  .region("asia-east2")
  .pubsub.schedule("0 0 1 * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    logger.info("Starting scheduled archive job.", {structuredData: true});
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thresholdTimestamp = admin.firestore.Timestamp.fromDate(sixMonthsAgo);

    try {
      const usersSnapshot = await db.collection("users").get();
      if (usersSnapshot.empty) {
        logger.info("No users found, ending archive job.");
        return null;
      }

      const archivePromises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const entriesRef = db.collection("users").doc(userId).collection("entries");
        const q = entriesRef.where("date", "<", thresholdTimestamp);
        const entriesToArchive = await q.get();

        if (entriesToArchive.empty) {
          logger.info(`User ${userId} has no entries to archive.`);
          return;
        }

        logger.info(`Found ${entriesToArchive.size} entries to archive for user ${userId}.`);

        const batch = db.batch();
        const storageUploadPromises: Promise<any>[] = [];

        entriesToArchive.forEach((doc) => {
          const entry = doc.data();
          const entryId = doc.id;

          if (!entry.date || !(entry.date instanceof admin.firestore.Timestamp)) {
            logger.warn(`Entry ${entryId} for user ${userId} has invalid date, skipping.`);
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

        logger.info(`Successfully archived ${storageUploadPromises.length} entries for user ${userId}.`);
      });

      await Promise.all(archivePromises);
      logger.info("Scheduled archive job completed successfully.");
      return null;
    } catch (error) {
      logger.error("Error during scheduled archive job:", error);
      throw error;
    }
  });
