const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
const transport = new StdioClientTransport({ command: "npx", args: ["@mobilenext/mobile-mcp@latest"] });

async function run() {
    await client.connect(transport);
    const devices = await client.callTool({ name: "mobile_list_available_devices", arguments: { noParams: {} } });
    const iosDevice = JSON.parse(devices.content[0].text).devices.find(d => d.platform === "ios" && d.state === "online");
    const ui = await client.callTool({ name: "mobile_list_elements_on_screen", arguments: { device: iosDevice.id } });
    console.log(ui.content[0].text);
    process.exit(0);
}
run();
