import * as si from 'systeminformation';
import { config } from '../config/index.js';

export interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    speed: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
    interfaces: string[];
  };
  system: {
    platform: string;
    uptime: number;
    loadAvg: number[];
    processes: number;
  };
  timestamp: Date;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

class SystemMonitor {
  private alerts: SystemAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    if (config.monitoring.enableAlerts) {
      this.startMonitoring();
    }
  }

  async getDetailedMetrics(): Promise<SystemMetrics> {
    try {
      const [cpu, mem, disk, network, load, processes] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.currentLoad(),
        si.processes(),
      ]);

      const cpuTemp = await si.cpuTemperature().catch(() => ({ main: 0 }));

      return {
        cpu: {
          usage: Math.round(load.currentLoad || 0),
          temperature: Math.round(cpuTemp.main || 0),
          speed: cpu.speed || 0,
          cores: cpu.cores || 0,
        },
        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          percentage: Math.round((mem.used / mem.total) * 100),
        },
        disk: {
          total: disk[0]?.size || 0,
          used: disk[0]?.used || 0,
          free: disk[0]?.available || 0,
          percentage: Math.round(((disk[0]?.used || 0) / (disk[0]?.size || 1)) * 100),
        },
        network: {
          rx: network[0]?.rx_sec || 0,
          tx: network[0]?.tx_sec || 0,
          interfaces: network.map(n => n.iface),
        },
        system: {
          platform: process.platform,
          uptime: Math.floor(process.uptime()),
          loadAvg: load.avgLoad ? [load.avgLoad] : [0],
          processes: processes.all || 0,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return this.getFallbackMetrics();
    }
  }

  private getFallbackMetrics(): SystemMetrics {
    const memory = process.memoryUsage();
    return {
      cpu: { usage: 0, temperature: 0, speed: 0, cores: 0 },
      memory: {
        total: memory.heapTotal,
        used: memory.heapUsed,
        free: memory.heapTotal - memory.heapUsed,
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      },
      disk: { total: 0, used: 0, free: 0, percentage: 0 },
      network: { rx: 0, tx: 0, interfaces: [] },
      system: {
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        loadAvg: [0],
        processes: 0,
      },
      timestamp: new Date(),
    };
  }

  async checkAlerts(metrics: SystemMetrics): Promise<SystemAlert[]> {
    const newAlerts: SystemAlert[] = [];

    // CPU usage alert
    if (metrics.cpu.usage > 90) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: metrics.cpu.usage > 95 ? 'critical' : 'warning',
        message: `High CPU usage: ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: 90,
        timestamp: new Date(),
      });
    }

    // Memory usage alert
    if (metrics.memory.percentage > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: metrics.memory.percentage > 95 ? 'critical' : 'warning',
        message: `High memory usage: ${metrics.memory.percentage}%`,
        value: metrics.memory.percentage,
        threshold: 85,
        timestamp: new Date(),
      });
    }

    // Disk usage alert
    if (metrics.disk.percentage > 80) {
      newAlerts.push({
        id: `disk-${Date.now()}`,
        type: metrics.disk.percentage > 90 ? 'critical' : 'warning',
        message: `High disk usage: ${metrics.disk.percentage}%`,
        value: metrics.disk.percentage,
        threshold: 80,
        timestamp: new Date(),
      });
    }

    // CPU temperature alert
    if (metrics.cpu.temperature > 70) {
      newAlerts.push({
        id: `temp-${Date.now()}`,
        type: metrics.cpu.temperature > 80 ? 'critical' : 'warning',
        message: `High CPU temperature: ${metrics.cpu.temperature}°C`,
        value: metrics.cpu.temperature,
        threshold: 70,
        timestamp: new Date(),
      });
    }

    this.alerts.push(...newAlerts);
    return newAlerts;
  }

  getAlerts(): SystemAlert[] {
    return this.alerts.slice(-50); // Keep last 50 alerts
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.getDetailedMetrics();
        await this.checkAlerts(metrics);
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, config.monitoring.refreshInterval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }
}

export const systemMonitor = new SystemMonitor();

export class SystemStatusService {
  async getStatus(): Promise<string> {
    if (config.monitoring.enableDetailedMetrics) {
      const metrics = await systemMonitor.getDetailedMetrics();
      return `PULSE System Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  SYSTEM INFO
Platform: ${metrics.system.platform}
Uptime: ${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m
Processes: ${metrics.system.processes}

⚡ CPU
Usage: ${metrics.cpu.usage}%
Temperature: ${metrics.cpu.temperature}°C
Cores: ${metrics.cpu.cores}
Speed: ${metrics.cpu.speed} GHz

💾 MEMORY
Usage: ${metrics.memory.percentage}% (${Math.round(metrics.memory.used / 1024 / 1024 / 1024)}GB / ${Math.round(metrics.memory.total / 1024 / 1024 / 1024)}GB)

💿 DISK
Usage: ${metrics.disk.percentage}% (${Math.round(metrics.disk.used / 1024 / 1024 / 1024)}GB / ${Math.round(metrics.disk.total / 1024 / 1024 / 1024)}GB)

🌐 NETWORK
Interfaces: ${metrics.network.interfaces.join(', ')}
RX: ${Math.round(metrics.network.rx / 1024)} KB/s
TX: ${Math.round(metrics.network.tx / 1024)} KB/s

📊 ALERTS
${systemMonitor.getAlerts().length} active alerts

Generated: ${metrics.timestamp.toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else {
      const platform = process.platform;
      const uptime = Math.floor(process.uptime());
      const memory = process.memoryUsage();
      
      return `System Status:
Platform: ${platform}
Uptime: ${uptime} seconds
Memory Usage: ${Math.round(memory.heapUsed / 1024 / 1024)} MB heap used
Architecture: ${process.arch}
Node Version: ${process.version}`;
    }
  }
}