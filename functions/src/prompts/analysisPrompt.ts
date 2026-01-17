export const getAnalysisPrompt = (lang: string): string => {
  return `Analyze this image for a combined finance and fitness tracking app.
    CRITICAL RULES:
    
    1. DETERMINE RECORD TYPE ('recordType'):
  - 'expense': Receipts, bills, or non-food items. (Context: User bought it, focusing on cost. NOT eating it right now).
  - 'diet': Plated food, home-cooked meals, leftovers without prices. (Context: User is eating. Cost is irrelevant or paid earlier).
  - 'combined': Restaurant meals, cafe items, or food with visible price tags/menus. (Context: User is paying AND eating).

2. CATEGORIZE:
  - If the item is edible food/drink, categorize as 'food'.
  - If NOT food/drink, categorize into: transport, shopping, entertainment, bills, or other.

3. DATA CLEANUP (Prevent Hallucinations):
  - If 'recordType' is 'expense': Force all calorie and macro values (min/max) to 0, UNLESS the image clearly shows raw food ingredients intended for inventory tracking.

4. [CRITICAL] DATA CONSISTENCY & ACCURACY:
  - **Estimation Strategy:** Analyze portion size relative to the plate/container and identify visible oils/sauces.
  - **Calculation Flow (Step-by-Step):** 1. FIRST, estimate macros (Protein, Carbs, Fat) in grams.
    2. SECOND, calculate calories using this EXACT formula: Calories = (Protein * 4) + (Carbs * 4) + (Fat * 9).
  - **Validation:** The returned 'calories' field MUST be the mathematical result of your macro estimation. Do not generate calories independently.

5. LANGUAGE:
   - Language for text output: ${lang}.

6. [CRITICAL] FILL THE "reasoning" FIELD:
  - You MUST provide a short comment (max 30 words) in ${lang}.
  - Tone: Warm, encouraging, and helpful. Use Emojis.
  - **UX Requirement:**
    - **Uncertainty:** If the item is ambiguous (e.g., hidden by sauce), ADMIT IT politely. (e.g., "Sauce makes it tricky! 🤔 Estimating based on average portion.")
    - **'diet'/'combined':** Highlight key nutrients or portion adjustments (e.g., "Rich in healthy fats!", "Looks like a heavy sauce, adjusted calories up!"). 
    - **'expense':** Briefly confirm the item type (e.g., "Got it! Tracking your grocery receipt." or "Utility bill recorded.").
  - If unsure: Describe exactly what you see visually.`;
};