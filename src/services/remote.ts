import { exec } from 'child_process';
import { promisify } from 'util';
// @ts-ignore - no types available for wake_on_lan
import * as wol from 'wake_on_lan';
import { config } from '../config/index.js';

const execAsync = promisify(exec);

export interface RemoteTarget {
  name: string;
  ip: string;
  mac: string;
  platform?: 'windows' | 'linux' | 'darwin';
  port?: number;
}

export interface RemoteOperation {
  id: string;
  target: string;
  operation: 'wake' | 'shutdown' | 'restart' | 'status';
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  error?: string;
  duration?: number;
}

class RemoteManagementService {
  private targets: Map<string, RemoteTarget> = new Map();
  private operations: RemoteOperation[] = [];

  constructor() {
    this.loadDefaultTargets();
  }

  private loadDefaultTargets(): void {
    // Load targets from environment variables
    const targetName = process.env.TARGET_PC_NAME;
    const targetIp = process.env.TARGET_PC_IP;
    const targetMac = process.env.TARGET_PC_MAC;
    const targetPlatform = process.env.TARGET_PC_PLATFORM as 'windows' | 'linux' | 'darwin' | undefined;

    if (targetName && targetIp && targetMac) {
      this.addTarget({
        name: targetName,
        ip: targetIp,
        mac: targetMac,
        platform: targetPlatform || 'linux',
      });
    }
  }

  addTarget(target: RemoteTarget): void {
    this.targets.set(target.name, target);
  }

  removeTarget(name: string): boolean {
    return this.targets.delete(name);
  }

  getTargets(): RemoteTarget[] {
    return Array.from(this.targets.values());
  }

  getTarget(name: string): RemoteTarget | undefined {
    return this.targets.get(name);
  }

  async wakeOnLan(targetName: string): Promise<RemoteOperation> {
    const operation: RemoteOperation = {
      id: `wake-${Date.now()}`,
      target: targetName,
      operation: 'wake',
      status: 'pending',
      timestamp: new Date(),
    };

    this.operations.push(operation);

    try {
      if (!config.remote.enableWakeOnLan) {
        throw new Error('Wake-on-LAN is disabled in configuration');
      }

      const target = this.targets.get(targetName);
      if (!target) {
        throw new Error(`Target '${targetName}' not found`);
      }

      const startTime = Date.now();
      
      await new Promise<void>((resolve, reject) => {
        wol.wake(target.mac, { address: target.ip }, (error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      operation.status = 'success';
      operation.duration = Date.now() - startTime;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return operation;
  }

  async shutdownLocal(): Promise<RemoteOperation> {
    const operation: RemoteOperation = {
      id: `shutdown-${Date.now()}`,
      target: 'localhost',
      operation: 'shutdown',
      status: 'pending',
      timestamp: new Date(),
    };

    this.operations.push(operation);

    try {
      if (!config.remote.allowSystemControl) {
        throw new Error('System control is disabled in configuration');
      }

      const platform = process.platform;
      let command = '';

      if (platform === 'win32') {
        command = 'shutdown /s /t 10';
      } else if (platform === 'darwin') {
        command = 'sudo shutdown -h +1';
      } else if (platform === 'linux') {
        command = 'sudo shutdown -h +1';
      } else {
        throw new Error(`Shutdown not supported on platform: ${platform}`);
      }

      const startTime = Date.now();
      await execAsync(command);
      
      operation.status = 'success';
      operation.duration = Date.now() - startTime;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return operation;
  }

  async restartLocal(): Promise<RemoteOperation> {
    const operation: RemoteOperation = {
      id: `restart-${Date.now()}`,
      target: 'localhost',
      operation: 'restart',
      status: 'pending',
      timestamp: new Date(),
    };

    this.operations.push(operation);

    try {
      if (!config.remote.allowSystemControl) {
        throw new Error('System control is disabled in configuration');
      }

      const platform = process.platform;
      let command = '';

      if (platform === 'win32') {
        command = 'shutdown /r /t 10';
      } else if (platform === 'darwin') {
        command = 'sudo shutdown -r +1';
      } else if (platform === 'linux') {
        command = 'sudo reboot';
      } else {
        throw new Error(`Restart not supported on platform: ${platform}`);
      }

      const startTime = Date.now();
      await execAsync(command);
      
      operation.status = 'success';
      operation.duration = Date.now() - startTime;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return operation;
  }

  async pingTarget(targetName: string): Promise<RemoteOperation> {
    const operation: RemoteOperation = {
      id: `ping-${Date.now()}`,
      target: targetName,
      operation: 'status',
      status: 'pending',
      timestamp: new Date(),
    };

    this.operations.push(operation);

    try {
      const target = this.targets.get(targetName);
      if (!target) {
        throw new Error(`Target '${targetName}' not found`);
      }

      const platform = process.platform;
      let command = '';

      if (platform === 'win32') {
        command = `ping -n 1 ${target.ip}`;
      } else {
        command = `ping -c 1 ${target.ip}`;
      }

      const startTime = Date.now();
      await execAsync(command);
      
      operation.status = 'success';
      operation.duration = Date.now() - startTime;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Host unreachable';
    }

    return operation;
  }

  getOperations(limit: number = 50): RemoteOperation[] {
    return this.operations.slice(-limit);
  }

  getOperationsByTarget(targetName: string, limit: number = 20): RemoteOperation[] {
    return this.operations
      .filter(op => op.target === targetName)
      .slice(-limit);
  }

  clearOperations(): void {
    this.operations = [];
  }

  async scheduleShutdown(delayMinutes: number): Promise<RemoteOperation> {
    const operation: RemoteOperation = {
      id: `scheduled-shutdown-${Date.now()}`,
      target: 'localhost',
      operation: 'shutdown',
      status: 'pending',
      timestamp: new Date(),
    };

    this.operations.push(operation);

    try {
      if (!config.remote.allowSystemControl) {
        throw new Error('System control is disabled in configuration');
      }

      if (delayMinutes < 1 || delayMinutes > 1440) { // 1 minute to 24 hours
        throw new Error('Delay must be between 1 and 1440 minutes');
      }

      const platform = process.platform;
      let command = '';

      if (platform === 'win32') {
        command = `shutdown /s /t ${delayMinutes * 60}`;
      } else if (platform === 'darwin') {
        command = `sudo shutdown -h +${delayMinutes}`;
      } else if (platform === 'linux') {
        command = `sudo shutdown -h +${delayMinutes}`;
      } else {
        throw new Error(`Scheduled shutdown not supported on platform: ${platform}`);
      }

      const startTime = Date.now();
      await execAsync(command);
      
      operation.status = 'success';
      operation.duration = Date.now() - startTime;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return operation;
  }

  async cancelScheduledShutdown(): Promise<RemoteOperation> {
    const operation: RemoteOperation = {
      id: `cancel-shutdown-${Date.now()}`,
      target: 'localhost',
      operation: 'shutdown',
      status: 'pending',
      timestamp: new Date(),
    };

    this.operations.push(operation);

    try {
      if (!config.remote.allowSystemControl) {
        throw new Error('System control is disabled in configuration');
      }

      const platform = process.platform;
      let command = '';

      if (platform === 'win32') {
        command = 'shutdown /a';
      } else if (platform === 'darwin' || platform === 'linux') {
        command = 'sudo shutdown -c';
      } else {
        throw new Error(`Cancel shutdown not supported on platform: ${platform}`);
      }

      const startTime = Date.now();
      await execAsync(command);
      
      operation.status = 'success';
      operation.duration = Date.now() - startTime;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return operation;
  }
}

export const remoteService = new RemoteManagementService(); 