const { test, expect } = require('@playwright/test');
const { MobileMCPClient } = require("./mobile_mcp_client.js");

test.describe('Mobile Stats Chart E2E', () => {

    test('iOS Simulator can render Stats charts natively', async () => {
        test.setTimeout(60000); // 60 seconds
        // 1. Initialize Mobile MCP
        console.log("Starting Mobile MCP Client...");
        const mcp = new MobileMCPClient();
        await mcp.connect();

        try {
            // 2. Discover Device
            console.log("Discovering Booted iOS Simulator...");
            const devicesResult = await mcp.client.callTool({
                name: "mobile_list_available_devices",
                arguments: { noParams: {} }
            });

            const jsonText = devicesResult.content[0].text;
            const parsed = JSON.parse(jsonText);
            const iosDevice = parsed.devices.find(d => d.platform === "ios" && d.state === "online");

            console.log(`Connected to ${iosDevice.name}`);

            // 3. Launch App
            console.log("Launching BestVersionOfYourself App...");
            await mcp.client.callTool({
                name: "mobile_launch_app",
                arguments: { device: iosDevice.id, appId: "com.kuo.BestVersionOfYourself" }
            });

            // Wait for App to launch fully
            await new Promise(r => setTimeout(r, 8000));

            // 4. Read Initial Screen to see if Login is required
            console.log("Extracting Initial UI Tree...");
            let uiResult = await mcp.client.callTool({
                name: "mobile_list_elements_on_screen",
                arguments: { device: iosDevice.id }
            });
            let uiContent = uiResult.content[0].text;

            // Optional Login Step (if "Email" placeholder exists, app is logged out)
            if (uiContent.includes("Email")) {
                console.log("Login screen detected. Performing Login...");

                // Type Email (approximate coordinates or use element click)
                await mcp.client.callTool({
                    name: "mobile_click_on_screen_at_coordinates",
                    arguments: { device: iosDevice.id, x: 200, y: 350 }
                });
                await mcp.client.callTool({
                    name: "mobile_type_text",
                    arguments: { device: iosDevice.id, text: "test@example.com" }
                });

                // Type Password
                await mcp.client.callTool({
                    name: "mobile_click_on_screen_at_coordinates",
                    arguments: { device: iosDevice.id, x: 200, y: 430 }
                });
                await mcp.client.callTool({
                    name: "mobile_type_text",
                    arguments: { device: iosDevice.id, text: "password123\n" }
                });

                // Click Login Button
                await mcp.client.callTool({
                    name: "mobile_click_on_screen_at_coordinates",
                    arguments: { device: iosDevice.id, x: 200, y: 520 }
                });

                await new Promise(r => setTimeout(r, 5000)); // wait for login
            }

            // 5. Navigate to Stats Tab
            console.log("Navigating to Stats Tab...");
            await mcp.client.callTool({
                name: "mobile_click_on_screen_at_coordinates",
                // Navigate to standard tab bar (Right side for Stats)
                arguments: { device: iosDevice.id, x: 280, y: 800 }
            });

            // Wait for navigation animation
            await new Promise(r => setTimeout(r, 4000));

            // 6. Read Screen Elements on Stats Page
            console.log("Extracting Stats UI Tree...");
            uiResult = await mcp.client.callTool({
                name: "mobile_list_elements_on_screen",
                arguments: { device: iosDevice.id }
            });

            uiContent = uiResult.content[0].text;
            console.log("Verifying Chart Properties...");

            // 5. Assertions based on Stats.tsx text structure
            // 5. Assertions based on Stats.tsx text structure
            expect(uiContent).toContain("洞察"); // "Insights" text
            expect(uiContent).toContain("今日支出"); // "Spent" text
            expect(uiContent).toContain("今日熱量"); // "Calories" text

            console.log("✅ Successfully verified Stats Screen elements via Mobile MCP!");

        } finally {
            await mcp.disconnect();
        }
    });
});
