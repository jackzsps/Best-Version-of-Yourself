const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

class MobileMCPClient {
    constructor() {
        this.client = null;
        this.transport = null;
    }

    async connect() {
        console.log("[Mobile MCP Client] Starting npx @mobilenext/mobile-mcp@latest...");
        this.transport = new StdioClientTransport({
            command: "npx",
            args: ["-y", "@mobilenext/mobile-mcp@latest"]
        });

        this.client = new Client({
            name: "e2e-test-runner",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        await this.client.connect(this.transport);
        console.log("[Mobile MCP Client] Connected successfully.");
    }

    async disconnect() {
        if (this.transport) {
            await this.transport.close();
            console.log("[Mobile MCP Client] Disconnected.");
        }
    }

    async runAction(platform, actionType, params = {}) {
        if (!this.client) {
            throw new Error("MCP Client not connected. Call connect() first.");
        }

        console.log(`[Mobile MCP Client] Calling tool: ${actionType} on ${platform}`, params);

        // Convert the generic testing actions to the actual MCP Tool names
        // mobile-mcp standardizes actions usually under "read_screen" / "click_element" 
        const args = { platform, ...params };

        try {
            const response = await this.client.callTool({
                name: actionType,
                arguments: args
            });
            return response;
        } catch (error) {
            console.error(`[Mobile MCP Client] Error executing ${actionType}:`, error.message);
            throw error;
        }
    }
}

module.exports = { MobileMCPClient };
