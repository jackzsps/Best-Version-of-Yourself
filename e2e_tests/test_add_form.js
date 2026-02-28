const { MobileMCPClient } = require("./mobile_mcp_client.js");
const fs = require('fs');

async function main() {
    console.log("Starting Mobile MCP Client...");
    const mcp = new MobileMCPClient();
    await mcp.connect();

    try {
        const devicesResult = await mcp.client.callTool({
            name: "mobile_list_available_devices",
            arguments: { noParams: {} }
        });

        const jsonText = devicesResult.content[0].text;
        const parsed = JSON.parse(jsonText);
        const iosDevice = parsed.devices.find(d => d.platform === "ios" && d.state === "online");
        console.log(`Connected to ${iosDevice.name}`);

        // Click Manual Entry (estimated x: 196, y: 420) based on previous layout
        console.log("Clicking Manual Entry (x:196, y:420)...");
        await mcp.client.callTool({
            name: "mobile_click_on_screen_at_coordinates",
            arguments: { device: iosDevice.id, x: 196, y: 420 }
        });

        await new Promise(r => setTimeout(r, 4000));

        // Let's dump the UI now
        console.log("Extracting Add Entry Form UI Tree...");
        const uiResult = await mcp.client.callTool({
            name: "mobile_list_elements_on_screen",
            arguments: { device: iosDevice.id }
        });
        fs.writeFileSync("ui_add_form.txt", uiResult.content[0].text);
        console.log("Saved Add Form UI to ui_add_form.txt.");

    } catch (e) {
        console.error(e);
    } finally {
        await mcp.disconnect();
    }
}

main();
