# PULSE - System Management Platform

**PULSE** is a comprehensive Model Context Protocol (MCP) server that enables natural language control of PC operations through AI interfaces. It provides system monitoring, remote management capabilities, and secure authentication for enterprise system administration.

![PULSE Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

## Features

### System Monitoring
- **Real-time Metrics**: CPU usage, memory, disk space, network statistics
- **Performance Alerts**: Automated threshold monitoring with warnings and critical alerts
- **Cross-platform Support**: Windows, macOS, and Linux compatibility
- **Historical Data**: Operation history and performance tracking

### Remote Management
- **Wake-on-LAN**: Remote system wake-up capabilities
- **System Control**: Shutdown, restart, and scheduled operations
- **Multi-target Support**: Manage multiple remote systems
- **Network Health**: Ping and connectivity monitoring

### Security & Authentication
- **JWT Authentication**: Secure token-based access control
- **BCrypt Encryption**: Industry-standard password hashing
- **Rate Limiting**: DDoS protection and request throttling
- **Trusted Networks**: IP-based access control

### AI Integration
- **Natural Language Control**: Control systems through conversational AI
- **Model Context Protocol**: Standards-compliant MCP server
- **Tool Integration**: Rich set of management tools for AI assistants

## Installation

### Prerequisites
- Node.js 18+ 
- TypeScript 5.8+
- pnpm (recommended) or npm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/edwarddjss/pulse-mcp.git
cd pulse-mcp

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Build and start
pnpm build
pnpm start
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
DEFAULT_ADMIN_PASSWORD=your-secure-password

# Remote Target (Optional)
TARGET_PC_NAME=MainPC
TARGET_PC_MAC=AA:BB:CC:DD:EE:FF
TARGET_PC_IP=192.168.1.100

# Security Settings
ENABLE_RATE_LIMIT=true
ALLOW_SYSTEM_CONTROL=true
TRUSTED_NETWORKS=127.0.0.1,::1

# Monitoring
ENABLE_DETAILED_METRICS=true
ENABLE_ALERTS=true
```

## Available Tools

PULSE provides 9 comprehensive management tools:

| Tool | Description | Capabilities |
|------|-------------|--------------|
| `system_status` | System monitoring | CPU, memory, disk, network metrics with alerts |
| `wake_on_lan` | Remote wake-up | Send WOL packets to configured targets |
| `shutdown_system` | System shutdown | Immediate or scheduled shutdown with cancellation |
| `restart_system` | System restart | Safe system restart operations |
| `ping_target` | Network connectivity | Test reachability of remote targets |
| `list_remote_targets` | Target management | View configured remote systems |
| `operation_history` | Activity tracking | Review recent operations and their status |
| `system_alerts` | Alert management | View and clear system performance alerts |
| `system_config` | Configuration | View current system settings and capabilities |

## Usage Examples

### System Monitoring
```bash
# Get comprehensive system status
{"tool": "system_status", "args": {"detailed": true}}

# View system alerts
{"tool": "system_alerts"}

# Clear all alerts
{"tool": "system_alerts", "args": {"clear": true}}
```

### Remote Management
```bash
# Wake up a remote PC
{"tool": "wake_on_lan", "args": {"target": "MainPC"}}

# Schedule shutdown in 30 minutes
{"tool": "shutdown_system", "args": {"delay": 30}}

# Restart system immediately
{"tool": "restart_system"}
```

### Network Operations
```bash
# Check remote system connectivity
{"tool": "ping_target", "args": {"target": "MainPC"}}

# List all configured targets
{"tool": "list_remote_targets"}

# View operation history
{"tool": "operation_history", "args": {"limit": 20}}
```

## Architecture

```
PULSE/
├── src/
│   ├── config/           # Configuration management
│   ├── services/         # Core business logic
│   │   ├── auth.ts       # Authentication & user management
│   │   ├── systemStatus.ts  # System monitoring & alerts
│   │   └── remote.ts     # Remote management & WOL
│   ├── tools/            # MCP tool definitions
│   └── index.ts          # Main server entry point
├── build/                # Compiled TypeScript
└── package.json
```

## Security Features

- **JWT Authentication**: Secure, stateless authentication
- **Password Hashing**: BCrypt with configurable rounds
- **Rate Limiting**: Configurable request throttling
- **Helmet Integration**: Security headers and protection
- **Network Filtering**: Trusted IP ranges
- **Audit Logging**: Operation tracking and history

## Cross-Platform Support

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| System Monitoring | ✅ | ✅ | ✅ |
| Wake-on-LAN | ✅ | ✅ | ✅ |
| Shutdown/Restart | ✅ | ✅ | ✅ |
| Network Operations | ✅ | ✅ | ✅ |
| Performance Alerts | ✅ | ✅ | ✅ |

## System Requirements

### Minimum Requirements
- **CPU**: 1 core, 1 GHz
- **Memory**: 512 MB RAM
- **Storage**: 100 MB free space
- **Network**: TCP/IP connectivity

### Recommended Requirements
- **CPU**: 2+ cores, 2+ GHz
- **Memory**: 2+ GB RAM
- **Storage**: 1+ GB free space
- **Network**: Gigabit Ethernet

## Performance Monitoring

PULSE includes comprehensive performance monitoring:

- **CPU Usage**: Real-time processor utilization
- **Memory Management**: RAM usage and availability
- **Disk Monitoring**: Storage capacity and I/O
- **Network Statistics**: Bandwidth and interface monitoring
- **Temperature Tracking**: CPU thermal monitoring (where supported)
- **Process Counting**: Active system processes

### Alert Thresholds
- **CPU Usage**: Warning at 90%, Critical at 95%
- **Memory Usage**: Warning at 85%, Critical at 95%
- **Disk Usage**: Warning at 80%, Critical at 90%
- **CPU Temperature**: Warning at 70°C, Critical at 80°C

## Development

### Building from Source
```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Production build
pnpm build

# Type checking
pnpm lint

# Clean build artifacts
pnpm clean
```

### Testing
```bash
# Run tests
pnpm test

# Test specific tool
node build/index.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Security**: Report security vulnerabilities privately

## Roadmap

- [ ] **Web Dashboard**: Browser-based management interface
- [ ] **Database Integration**: Persistent storage for metrics and history
- [ ] **Plugin System**: Extensible architecture for custom tools
- [ ] **Container Support**: Docker deployment options
- [ ] **API Gateway**: REST API for external integrations
- [ ] **Multi-user Support**: Role-based access control
- [ ] **Mobile App**: iOS/Android companion app

---

**PULSE** - Empowering system administration through intelligent automation and natural language control.
