const { MobileMCPClient } = require("./mobile_mcp_client.js");
const fs = require('fs');

async function main() {
    console.log("Starting Mobile MCP Client...");
    const mcp = new MobileMCPClient();
    await mcp.connect();

    try {
        console.log("Discovering Booted iOS Simulator...");
        const devicesResult = await mcp.client.callTool({
            name: "mobile_list_available_devices",
            arguments: { noParams: {} }
        });

        const jsonText = devicesResult.content[0].text;
        const parsed = JSON.parse(jsonText);
        const iosDevice = parsed.devices.find(d => d.platform === "ios" && d.state === "online");

        console.log(`Connected to ${iosDevice.name}`);

        console.log("Extracting Home UI Tree...");
        let uiResult = await mcp.client.callTool({
            name: "mobile_list_elements_on_screen",
            arguments: { device: iosDevice.id }
        });
        
        fs.writeFileSync("ui_home.txt", uiResult.content[0].text);
        console.log("Saved home UI to ui_home.txt. Please verify the Add Tab (usually middle) coordinates.");

        // Let's assume Add Tab is at x: 200, y: 800
        console.log("Clicking Add Tab (x:200, y:800)...");
        await mcp.client.callTool({
            name: "mobile_click_on_screen_at_coordinates",
            arguments: { device: iosDevice.id, x: 200, y: 800 }
        });

        await new Promise(r => setTimeout(r, 4000));

        console.log("Extracting Add Entry Pre-Manual UI Tree...");
        uiResult = await mcp.client.callTool({
            name: "mobile_list_elements_on_screen",
            arguments: { device: iosDevice.id }
        });
        fs.writeFileSync("ui_add_initial.txt", uiResult.content[0].text);
        console.log("Saved Add Initial UI to ui_add_initial.txt.");
        
        // Let's assume Manual Entry button is somewhere. 
        // We'll read the text file to find the click coordinates for 手動輸入.

    } catch (e) {
        console.error(e);
    } finally {
        await mcp.disconnect();
    }
}

main();
