# PULSE (pulse-mcp)

A Model Context Protocol (MCP) server that allows you to control your PC through natural language interfaces like Claude.

## Features

- Check system status
- (Coming soon) Power on a remote PC using Wake-on-LAN
- (Coming soon) Restart your PC
- (Coming soon) Shutdown your PC

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your settings
4. Build the project: `npm run build`
5. Run the server: `npm start`

## Testing

You can test the server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js