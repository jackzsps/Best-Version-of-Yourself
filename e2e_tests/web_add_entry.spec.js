import { test, expect } from '@playwright/test';

test.describe('Web Add Entry E2E', () => {

    test('User can manually add a new financial entry', async ({ page }) => {
        // Playwright tests the React Web App
        console.log("Navigating to Web App...");
        await page.goto('http://localhost:9002');

        // Check if we need to login
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() > 0) {
            console.log("Logging in...");
            await emailInput.fill('test@example.com');
            await page.locator('input[type="password"]').fill('password123');
            await page.getByRole('button', { name: /login|登入/i }).click();
        }

        // Wait for dashboard to load by checking for the nav bar ADD button
        console.log("Waiting for Dashboard to load...");
        const addButton = page.locator('a[href="/add"]');
        await expect(addButton).toBeVisible({ timeout: 15000 });

        // Click Add Entry Nav
        await addButton.click();

        // Need to click "Manual Entry" (手動輸入)
        console.log("Switching to Manual Entry mode...");
        const manualButton = page.getByRole('button', { name: /手動輸入/i }).first();
        await expect(manualButton).toBeVisible();
        await manualButton.click();

        // Fill out the Add Entry Form
        console.log("Filling out entry form...");
        // Usually the item name is the first text input in the review step
        const itemNameInput = page.locator('input[type="text"]').first();
        await expect(itemNameInput).toBeVisible();

        const uniqueItemName = `Automated Test Expense ${Date.now()}`;
        await itemNameInput.fill(uniqueItemName);

        // Find the cost input (number input with placeholder 0.00)
        const costInput = page.locator('input[type="number"][placeholder="0.00"]');
        await expect(costInput).toBeVisible();
        await costInput.fill('99.99');

        // Click Save Button
        console.log("Saving entry...");
        const saveButton = page.getByRole('button', { name: /save|儲存/i });
        await saveButton.click();

        // Verify successful save: Wait for a toast message or redirection to Home
        console.log("Verifying successful save...");

        // Either the URL changes back to root, or a success message is shown
        // In AddEntry.tsx, it does NOT navigate to `/` by default (it's commented out) 
        // but it does reset the state back to 'upload' and shows a Toast.

        // Check if camera upload button comes back
        const captureText = page.getByText(/Tap to Capture/i);
        await expect(captureText).toBeVisible({ timeout: 10000 });

        console.log("✅ Successfully verified 'Add Entry' functionality on Web!");
    });
});
