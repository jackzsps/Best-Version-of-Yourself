const { MobileMCPClient } = require("./mobile_mcp_client.js");

async function main() {
    const mcp = new MobileMCPClient();
    try {
        await mcp.connect();
        const toolsResult = await mcp.client.listTools();
        const toolNames = toolsResult.tools.map(t => t.name);
        console.log("\n--- AVAILABLE MCP TOOLS ---");
        console.log(toolNames.join("\n"));
        console.log("---------------------------\n");
    } catch (e) {
        console.error("Failed:", e);
    } finally {
        await mcp.disconnect();
    }
}
main();
