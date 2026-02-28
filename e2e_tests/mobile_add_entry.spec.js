const { test, expect } = require('@playwright/test');
const { MobileMCPClient } = require("./mobile_mcp_client.js");

test.describe('Mobile Add Entry E2E', () => {
    test.setTimeout(180000); // 3 minutes total timeout for the entire suite

    test('iOS Simulator can add an entry natively', async () => {
        test.setTimeout(160000); // 160 seconds for this specific test
        console.log("Starting Mobile MCP Client...");
        const mcp = new MobileMCPClient();
        await mcp.connect();

        try {
            // 1. Discover Device
            console.log("Discovering Booted iOS Simulator...");
            const devicesResult = await mcp.client.callTool({
                name: "mobile_list_available_devices",
                arguments: { noParams: {} }
            });

            const jsonText = devicesResult.content[0].text;
            const parsed = JSON.parse(jsonText);
            const iosDevice = parsed.devices.find(d => d.platform === "ios" && d.state === "online");

            console.log(`Connected to ${iosDevice.name}`);

            // 2. Launch App
            console.log("Launching BestVersionOfYourself App...");
            await mcp.client.callTool({
                name: "mobile_launch_app",
                arguments: { device: iosDevice.id, appId: "com.kuo.BestVersionOfYourself" }
            });

            // Wait for App to launch fully
            await new Promise(r => setTimeout(r, 8000));

            // 2.5 Login to ensure Save entry does not silently fail
            console.log("Navigating to Settings Tab for Login...");
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 350, y: 800 } });
            await new Promise(r => setTimeout(r, 2000));

            console.log("Tapping Sign In / Register...");
            let settingsUi = await mcp.client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
            let settingsElements = JSON.parse(settingsUi.content[0].text.replace('Found these elements on screen: ', ''));
            let signInBtn = settingsElements.find(e => e.identifier === "settings-signin-button" || e.name === "settings-signin-button" || e.label === "Sign In / Register" || e.label === "登入 / 註冊");

            if (signInBtn) {
                console.log("Found Sign In / Register Button. Tapping...");
                let sx = Math.floor(signInBtn.coordinates.x + (signInBtn.coordinates.width / 2));
                let sy = Math.floor(signInBtn.coordinates.y + (signInBtn.coordinates.height / 2));
                await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: sx, y: sy } });
                await new Promise(r => setTimeout(r, 2000));

                console.log("Typing Test Credentials...");
                let authUi = await mcp.client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
                let authElements = JSON.parse(authUi.content[0].text.replace('Found these elements on screen: ', ''));

                let emailInput = authElements.find(e => e.identifier === "email-input" || e.name === "email-input");
                if (emailInput) {
                    await mcp.client.callTool({ name: "mobile_type_text_into_element", arguments: { device: iosDevice.id, text: "test@bvoy.com", elementId: emailInput.identifier || emailInput.name } });
                    await new Promise(r => setTimeout(r, 1000));
                }

                let passInput = authElements.find(e => e.identifier === "password-input" || e.name === "password-input");
                if (passInput) {
                    await mcp.client.callTool({ name: "mobile_type_text_into_element", arguments: { device: iosDevice.id, text: "password123", elementId: passInput.identifier || passInput.name } });
                    await new Promise(r => setTimeout(r, 1000));
                }

                let submitBtn = authElements.find(e => e.identifier === "auth-submit-button" || e.name === "auth-submit-button");
                if (submitBtn) {
                    let ssx = Math.floor(submitBtn.coordinates.x + (submitBtn.coordinates.width / 2));
                    let ssy = Math.floor(submitBtn.coordinates.y + (submitBtn.coordinates.height / 2));
                    await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: ssx, y: ssy } });
                } else {
                    await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: 560 } });
                }
                await new Promise(r => setTimeout(r, 4000));
            } else {
                console.log("Already Logged In or Sign In button not found. Proceeding...");
            }

            // 3. Navigate to Add Tab (middle bottom tab)
            console.log("Navigating to Add Tab...");
            await mcp.client.callTool({
                name: "mobile_click_on_screen_at_coordinates",
                arguments: { device: iosDevice.id, x: 200, y: 800 }
            });
            await new Promise(r => setTimeout(r, 3000));

            // 4. Tap "Manual Entry" (手動輸入) which is slightly below the Capture button
            console.log("Tapping Manual Entry...");
            await mcp.client.callTool({
                name: "mobile_click_on_screen_at_coordinates",
                arguments: { device: iosDevice.id, x: 196, y: 420 }
            });
            await new Promise(r => setTimeout(r, 2000));

            // Scroll UP to ensure the top of the form is visible (swipe down)
            console.log("Resetting scroll position to top...");
            await mcp.client.callTool({ name: "mobile_swipe_on_screen", arguments: { device: iosDevice.id, direction: "down", x: 200, y: 300, distance: 400 } });
            await new Promise(r => setTimeout(r, 1500));

            // Dynamically locate TextFields before any keyboard is open
            console.log("Locating input fields dynamically...");
            let formUiResult = await mcp.client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
            let formElements = JSON.parse(formUiResult.content[0].text.replace('Found these elements on screen: ', ''));
            let textFields = formElements.filter(e => e.type === "TextField").sort((a, b) => a.coordinates.y - b.coordinates.y);

            if (textFields.length < 2) {
                console.log("WARNING: Could not find both Item Name and Cost TextFields! Found:", textFields.length);
            }

            // Assume textFields[0] is Item Name and textFields[1] is Cost based on layout Order.
            let itemNameField = textFields[0];
            let costField = textFields[1];

            let nameY = itemNameField ? Math.floor(itemNameField.coordinates.y + (itemNameField.coordinates.height / 2)) : 100;
            let costY = costField ? Math.floor(costField.coordinates.y + (costField.coordinates.height / 2)) : 180;

            // 5. Paste Item Name natively via simctl pasteboard
            console.log("Focusing Item Name field...");
            const uniqueName = `Item${Date.now()}`;
            console.log(`Item name to input: ${uniqueName}`);

            require('child_process').execSync(`xcrun simctl pbcopy ${iosDevice.id} <<< "${uniqueName}"`, { shell: '/bin/bash' });

            // Tap first time to focus
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: nameY } });
            await new Promise(r => setTimeout(r, 1500));

            // Tap second time to show Edit Menu (Cut/Copy/Paste)
            console.log("Tapping again to show Edit Menu...");
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: nameY } });
            await new Promise(r => setTimeout(r, 1500));

            let editMenuResult = await mcp.client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
            let editElements = JSON.parse(editMenuResult.content[0].text.replace('Found these elements on screen: ', ''));
            let pasteBtn = editElements.find(e => e.label === "Paste" || e.label === "貼上");

            if (pasteBtn) {
                console.log("Found Paste button! Tapping it...");
                let cx = Math.floor(pasteBtn.coordinates.x + (pasteBtn.coordinates.width / 2));
                let cy = Math.floor(pasteBtn.coordinates.y + (pasteBtn.coordinates.height / 2));
                await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: cx, y: cy } });
                await new Promise(r => setTimeout(r, 1000));
            } else {
                console.log("Paste button not found in Edit Menu!");
            }

            // 6. Type Cost using Paste mechanism (mobile_type_text is unreliable)
            console.log(`Pasting '99' into Cost field at y:${costY}...`);
            require('child_process').execSync(`xcrun simctl pbcopy ${iosDevice.id} <<< "99"`, { shell: '/bin/bash' });

            // First tap to focus Cost field
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: costY } });
            await new Promise(r => setTimeout(r, 1000));
            // Second tap to show Edit Menu
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: costY } });
            await new Promise(r => setTimeout(r, 1500));

            let costMenuElementsResult = await mcp.client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
            let costMenuElements = JSON.parse(costMenuElementsResult.content[0].text.replace('Found these elements on screen: ', ''));
            let costPasteBtn = costMenuElements.find(e => e.label === "Paste" || e.label === "貼上");

            if (costPasteBtn) {
                console.log("Found Paste button for Cost! Tapping it...");
                let cpx = Math.floor(costPasteBtn.coordinates.x + (costPasteBtn.coordinates.width / 2));
                let cpy = Math.floor(costPasteBtn.coordinates.y + (costPasteBtn.coordinates.height / 2));
                await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: cpx, y: cpy } });
                await new Promise(r => setTimeout(r, 1000));
            } else {
                console.log("Paste button not found for Cost, tapping fallback coordinates (100, 297)...");
                await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 100, y: 297 } });
                await new Promise(r => setTimeout(r, 1000));
            }
            // Explicitly dismiss keyboard by tapping the header area (y:150) where no inputs exist
            console.log("Dismissing keyboard by tapping the safe area spacing (y:150)...");
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: 150 } });
            await new Promise(r => setTimeout(r, 1000));
            // Just for good measure, tap it again to be absolutely sure
            await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: 150 } });
            await new Promise(r => setTimeout(r, 1000));

            // Swipe UP to scroll down and dismiss the keyboard via drag
            console.log("Swiping up to reveal Save button and dismiss keyboard...");
            await mcp.client.callTool({ name: "mobile_swipe_on_screen", arguments: { device: iosDevice.id, direction: "up", x: 200, y: 500, distance: 300 } });
            await new Promise(r => setTimeout(r, 1500));

            // 7. Scroll down to find and Tap Save Button
            console.log("Swiping up to scroll down and reveal the Save Button...");
            await mcp.client.callTool({ name: "mobile_swipe_on_screen", arguments: { device: iosDevice.id, direction: "up", x: 200, y: 600, distance: 400 } });
            await new Promise(r => setTimeout(r, 1000));
            // Just one strong swipe is enough to bring the bottom of the form up to y ~ 500

            console.log("Looking for Save button dynamically, and applying wide range of explicit taps...");
            let finalUiResult = await mcp.client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
            let finalUiElements = JSON.parse(finalUiResult.content[0].text.replace('Found these elements on screen: ', ''));

            // The Save button is a TouchableOpacity. We added testID="save-entry-button" so XCUITest surfaces it as identifier.
            let saveBtn = finalUiElements.find(e =>
            (e.identifier === "save-entry-button" || e.name === "save-entry-button" ||
                e.label === "儲存紀錄" || e.identifier === "儲存紀錄" || e.value === "儲存紀錄" ||
                e.label === "Save Entry" || e.name === "Save Entry")
            );

            if (saveBtn) {
                console.log(`Found Save button ('${saveBtn.identifier || saveBtn.label}'). Tapping coordinates...`);
                let sx = Math.floor(saveBtn.coordinates.x + (saveBtn.coordinates.width / 2));
                let sy = Math.floor(saveBtn.coordinates.y + (saveBtn.coordinates.height / 2));
                await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: sx, y: sy } });
            } else {
                console.log("Save button not found dynamically. Tapping precisely at y=535 to hit the button...");
                // The 'Need' text is at y=457. Layout: 19px text + 16px mb + 20px mt = 512px. Button is 50px tall. So center is ~537.
                await mcp.client.callTool({ name: "mobile_click_on_screen_at_coordinates", arguments: { device: iosDevice.id, x: 200, y: 535 } });
            }

            await new Promise(r => setTimeout(r, 4000)); // Wait for API response and navigation

            // 8. Verify the entry was submitted
            console.log("Verifying successful submission...");
            let uiResult = await mcp.client.callTool({
                name: "mobile_list_elements_on_screen",
                arguments: { device: iosDevice.id }
            });
            let uiContent = uiResult.content[0].text;

            expect(uiContent).toContain("洞察"); // Means we are at least back on a normal tab
            // The item text should ideally be visible in the recent records list
            expect(uiContent).toContain(uniqueName);

            console.log(`✅ Successfully added and verified entry: ${uniqueName}`);

        } finally {
            await mcp.disconnect();
        }
    });

});
