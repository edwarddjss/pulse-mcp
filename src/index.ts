import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { config } from "./config/index.js";
import { systemStatusTool } from "./tools/systemTools.js";

const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
    capabilities: {
        tools: {}
    }
});

// register tools
server.tool(
    systemStatusTool.name,
    systemStatusTool.description,
    async () => {
        const status = await systemStatusTool.handler();
        return {
            content: [{
                type: "text",
                text: status
            }]
        };
    }
);

// start the server
async function main() {
    console.error(`PULSE ${config.server.version} starting...`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`PULSE is now running!`);
}

main().catch(error => {
    console.error(`Fatal error:`, error);
    process.exit(1);
});