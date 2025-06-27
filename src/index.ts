#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { config } from "./config/index.js";
import {
  systemStatusTool,
  wakeOnLanTool,
  shutdownTool,
  restartTool,
  pingTool,
  remoteTargetsTool,
  operationHistoryTool,
  alertsTool,
  configTool,
} from "./tools/systemTools.js";

// Tool definitions for MCP
const tools = [
  systemStatusTool,
  wakeOnLanTool,
  shutdownTool,
  restartTool,
  pingTool,
  remoteTargetsTool,
  operationHistoryTool,
  alertsTool,
  configTool,
];

class PulseServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: config.server.name,
      version: config.server.version,
      capabilities: {
        tools: {}
      }
    });

    this.setupTools();
    this.setupErrorHandling();
  }

  private setupTools(): void {
    // Register all tools
    for (const tool of tools) {
      this.server.tool(
        tool.name,
        tool.description,
        tool.inputSchema,
        async (args: any) => {
          try {
            console.error(`[${new Date().toISOString()}] Executing tool: ${tool.name}`, args);
            const result = await tool.handler(args);
            console.error(`[${new Date().toISOString()}] Tool ${tool.name} completed successfully`);
            
            return {
              content: [
                {
                  type: "text",
                  text: result,
                },
              ],
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[${new Date().toISOString()}] Tool ${tool.name} failed:`, errorMessage);
            
            return {
              content: [
                {
                  type: "text",
                  text: `❌ Error executing ${tool.name}: ${errorMessage}`,
                },
              ],
            };
          }
        }
      );
    }

    console.error(`[${new Date().toISOString()}] Registered ${tools.length} tools:`, tools.map(t => t.name).join(', '));
  }

  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      console.error(`[${new Date().toISOString()}] PULSE server shutting down gracefully...`);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error(`[${new Date().toISOString()}] PULSE server terminating...`);
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    try {
      console.error(`[${new Date().toISOString()}] Starting PULSE ${config.server.version}...`);
      console.error(`[${new Date().toISOString()}] Configuration loaded:`);
      console.error(`  - Wake-on-LAN: ${config.remote.enableWakeOnLan ? 'Enabled' : 'Disabled'}`);
      console.error(`  - System Control: ${config.remote.allowSystemControl ? 'Enabled' : 'Disabled'}`);
      console.error(`  - Detailed Metrics: ${config.monitoring.enableDetailedMetrics ? 'Enabled' : 'Disabled'}`);
      console.error(`  - Alerts: ${config.monitoring.enableAlerts ? 'Enabled' : 'Disabled'}`);

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error(`[${new Date().toISOString()}] PULSE is now running and ready to accept requests!`);
      console.error(`[${new Date().toISOString()}] Available tools: ${tools.length}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Fatal error starting PULSE:`, error);
      process.exit(1);
    }
  }
}

// Start the server
async function main() {
  const pulseServer = new PulseServer();
  await pulseServer.start();
}

main().catch((error) => {
  console.error(`[${new Date().toISOString()}] Fatal error in main:`, error);
  process.exit(1);
});