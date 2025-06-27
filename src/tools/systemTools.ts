import { SystemStatusService, systemMonitor } from '../services/systemStatus.js';
import { remoteService } from '../services/remote.js';
import { authService } from '../services/auth.js';
import { config } from '../config/index.js';

const systemStatusService = new SystemStatusService();

export const systemStatusTool = {
  name: 'system_status',
  description: 'Get comprehensive system status including CPU, memory, disk, network, and alerts',
  inputSchema: {
    type: 'object',
    properties: {
      detailed: {
        type: 'boolean',
        description: 'Whether to include detailed metrics',
        default: true,
      },
    },
  },
  handler: async (args?: { detailed?: boolean }) => {
    try {
      const detailed = args?.detailed ?? config.monitoring.enableDetailedMetrics;
      
      if (detailed) {
        const metrics = await systemMonitor.getDetailedMetrics();
        const alerts = systemMonitor.getAlerts();
        
        return `${await systemStatusService.getStatus()}

🚨 ACTIVE ALERTS (${alerts.length})
${alerts.length > 0 ? alerts.map(alert => 
  `${alert.type === 'critical' ? '🔴' : '🟡'} ${alert.message} (${alert.timestamp.toLocaleTimeString()})`
).join('\n') : 'No active alerts'}

⚙️ MONITORING
Refresh Interval: ${config.monitoring.refreshInterval}ms
Alerts Enabled: ${config.monitoring.enableAlerts ? 'Yes' : 'No'}
Detailed Metrics: ${config.monitoring.enableDetailedMetrics ? 'Yes' : 'No'}`;
      } else {
        return await systemStatusService.getStatus();
      }
    } catch (error) {
      return `Error getting system status: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const wakeOnLanTool = {
  name: 'wake_on_lan',
  description: 'Wake up a remote PC using Wake-on-LAN',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Name of the target PC to wake up',
      },
    },
    required: ['target'],
  },
  handler: async (args: { target: string }) => {
    try {
      if (!config.remote.enableWakeOnLan) {
        return 'Wake-on-LAN is disabled in configuration';
      }

      const operation = await remoteService.wakeOnLan(args.target);
      
      if (operation.status === 'success') {
        return `✅ Wake-on-LAN packet sent to '${args.target}' successfully in ${operation.duration}ms`;
      } else {
        return `❌ Failed to wake '${args.target}': ${operation.error}`;
      }
    } catch (error) {
      return `Error sending Wake-on-LAN: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const shutdownTool = {
  name: 'shutdown_system',
  description: 'Shutdown the local system',
  inputSchema: {
    type: 'object',
    properties: {
      delay: {
        type: 'number',
        description: 'Delay in minutes before shutdown (1-1440)',
        minimum: 1,
        maximum: 1440,
      },
      cancel: {
        type: 'boolean',
        description: 'Cancel a scheduled shutdown',
        default: false,
      },
    },
  },
  handler: async (args?: { delay?: number; cancel?: boolean }) => {
    try {
      if (!config.remote.allowSystemControl) {
        return 'System control is disabled in configuration';
      }

      if (args?.cancel) {
        const operation = await remoteService.cancelScheduledShutdown();
        if (operation.status === 'success') {
          return '✅ Scheduled shutdown cancelled successfully';
        } else {
          return `❌ Failed to cancel shutdown: ${operation.error}`;
        }
      }

      if (args?.delay) {
        const operation = await remoteService.scheduleShutdown(args.delay);
        if (operation.status === 'success') {
          return `✅ System shutdown scheduled for ${args.delay} minutes from now`;
        } else {
          return `❌ Failed to schedule shutdown: ${operation.error}`;
        }
      } else {
        const operation = await remoteService.shutdownLocal();
        if (operation.status === 'success') {
          return '✅ System shutdown initiated successfully';
        } else {
          return `❌ Failed to shutdown system: ${operation.error}`;
        }
      }
    } catch (error) {
      return `Error controlling system shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const restartTool = {
  name: 'restart_system',
  description: 'Restart the local system',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    try {
      if (!config.remote.allowSystemControl) {
        return 'System control is disabled in configuration';
      }

      const operation = await remoteService.restartLocal();
      
      if (operation.status === 'success') {
        return '✅ System restart initiated successfully';
      } else {
        return `❌ Failed to restart system: ${operation.error}`;
      }
    } catch (error) {
      return `Error restarting system: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const pingTool = {
  name: 'ping_target',
  description: 'Check if a remote target is reachable',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Name of the target to ping',
      },
    },
    required: ['target'],
  },
  handler: async (args: { target: string }) => {
    try {
      const operation = await remoteService.pingTarget(args.target);
      
      if (operation.status === 'success') {
        return `✅ Target '${args.target}' is reachable (${operation.duration}ms)`;
      } else {
        return `❌ Target '${args.target}' is unreachable: ${operation.error}`;
      }
    } catch (error) {
      return `Error pinging target: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const remoteTargetsTool = {
  name: 'list_remote_targets',
  description: 'List configured remote targets',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    try {
      const targets = remoteService.getTargets();
      
      if (targets.length === 0) {
        return 'No remote targets configured. Add targets via environment variables or configuration.';
      }

      return `📡 REMOTE TARGETS (${targets.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${targets.map(target => 
  `🖥️  ${target.name}
   IP: ${target.ip}
   MAC: ${target.mac}
   Platform: ${target.platform || 'unknown'}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } catch (error) {
      return `Error listing targets: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const operationHistoryTool = {
  name: 'operation_history',
  description: 'View recent remote operations',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Filter by target name (optional)',
      },
      limit: {
        type: 'number',
        description: 'Number of operations to show',
        default: 10,
        minimum: 1,
        maximum: 50,
      },
    },
  },
  handler: async (args?: { target?: string; limit?: number }) => {
    try {
      const limit = args?.limit || 10;
      const operations = args?.target 
        ? remoteService.getOperationsByTarget(args.target, limit)
        : remoteService.getOperations(limit);

      if (operations.length === 0) {
        return 'No operations found in history.';
      }

      return `📊 OPERATION HISTORY ${args?.target ? `(${args.target})` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${operations.map(op => 
  `${op.status === 'success' ? '✅' : op.status === 'failed' ? '❌' : '⏳'} ${op.operation.toUpperCase()} → ${op.target}
   Time: ${op.timestamp.toLocaleString()}
   Duration: ${op.duration ? `${op.duration}ms` : 'N/A'}
   ${op.error ? `Error: ${op.error}` : ''}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } catch (error) {
      return `Error getting operation history: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const alertsTool = {
  name: 'system_alerts',
  description: 'View and manage system alerts',
  inputSchema: {
    type: 'object',
    properties: {
      clear: {
        type: 'boolean',
        description: 'Clear all alerts',
        default: false,
      },
    },
  },
  handler: async (args?: { clear?: boolean }) => {
    try {
      if (args?.clear) {
        systemMonitor.clearAlerts();
        return '✅ All system alerts cleared';
      }

      const alerts = systemMonitor.getAlerts();
      
      if (alerts.length === 0) {
        return '✅ No active system alerts';
      }

      const criticalAlerts = alerts.filter(a => a.type === 'critical');
      const warningAlerts = alerts.filter(a => a.type === 'warning');

      return `🚨 SYSTEM ALERTS (${alerts.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL ALERTS (${criticalAlerts.length})
${criticalAlerts.map(alert => 
  `   ${alert.message}
   Value: ${alert.value} (threshold: ${alert.threshold})
   Time: ${alert.timestamp.toLocaleString()}`
).join('\n')}

🟡 WARNING ALERTS (${warningAlerts.length})
${warningAlerts.map(alert => 
  `   ${alert.message}
   Value: ${alert.value} (threshold: ${alert.threshold})
   Time: ${alert.timestamp.toLocaleString()}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } catch (error) {
      return `Error managing alerts: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

export const configTool = {
  name: 'system_config',
  description: 'View system configuration and capabilities',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    try {
      return `⚙️ PULSE CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️ SERVER
Name: ${config.server.name}
Version: ${config.server.version}
Port: ${config.server.port}

🔐 AUTHENTICATION
Token Expiry: ${config.auth.tokenExpiry}
BCrypt Rounds: ${config.auth.bcryptRounds}

🛡️ SECURITY
Rate Limiting: ${config.security.enableRateLimit ? 'Enabled' : 'Disabled'}
Max Requests: ${config.security.maxRequests}/${config.security.windowMs}ms
Helmet: ${config.security.enableHelmet ? 'Enabled' : 'Disabled'}

📡 REMOTE MANAGEMENT
Wake-on-LAN: ${config.remote.enableWakeOnLan ? 'Enabled' : 'Disabled'}
System Control: ${config.remote.allowSystemControl ? 'Enabled' : 'Disabled'}
Trusted Networks: ${config.remote.trustedNetworks.join(', ')}

📊 MONITORING
Detailed Metrics: ${config.monitoring.enableDetailedMetrics ? 'Enabled' : 'Disabled'}
Refresh Interval: ${config.monitoring.refreshInterval}ms
Alerts: ${config.monitoring.enableAlerts ? 'Enabled' : 'Disabled'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } catch (error) {
      return `Error getting configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};