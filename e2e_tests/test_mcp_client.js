const { MobileMCPClient } = require("./mobile_mcp_client.js");

async function main() {
    const mcp = new MobileMCPClient();
    try {
        await mcp.connect();

        console.log("Fetching available devices...");
        const devicesResult = await mcp.client.callTool({
            name: "mobile_list_available_devices",
            arguments: { noParams: {} }
        });

        // Parse the JSON string out of the content object 
        const jsonText = devicesResult.content[0].text;
        const parsed = JSON.parse(jsonText);

        const iosDevice = parsed.devices.find(d => d.platform === "ios" && d.state === "online");

        if (iosDevice) {
            console.log(`\nFound Booted Simulator ID: ${iosDevice.id} (${iosDevice.name})`);

            console.log("Fetching UI tree from iOS Simulator...");
            const uiResult = await mcp.client.callTool({
                name: "mobile_list_elements_on_screen",
                arguments: { device: iosDevice.id }
            });

            console.log("Success! Server Response Preview:", JSON.stringify(uiResult).substring(0, 1000) + "... (truncated)");
        } else {
            console.log("Could not find a booted iOS Simulator from the JSON list.");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        await mcp.disconnect();
    }
}

main();
