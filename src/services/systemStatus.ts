import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SystemStatusService {
    async getStatus(): Promise<string> {
        try {
            // different commands depedning on OS
            const platform = process.platform;
            let command = '';

            if (platform === 'win32') {
                // windows (powershell command is faster than cmd)
                command = '(Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime';
            } else if (platform === 'darwin') {
                // macOS
                command = 'uptime';
            } else if (platform === 'linux') {
                // linux
                command = 'uptime -p';
            } else {
                return `Unsupported platform: ${platform}`;
            }

            const { stdout } = await execAsync(command);
            return `System is running. ${stdout.trim()}`;
        } catch (error) {
            console.error("Error getting system status:" , error);
            return `Error retrieving system status.`;
            }
        }
    }