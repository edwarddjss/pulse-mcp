import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  server: z.object({
    name: z.string().default('PULSE'),
    version: z.string().default('2.0.0'),
    port: z.number().default(3000),
  }),
  auth: z.object({
    jwtSecret: z.string().min(32),
    bcryptRounds: z.number().default(12),
    tokenExpiry: z.string().default('24h'),
  }),
  security: z.object({
    enableRateLimit: z.boolean().default(true),
    maxRequests: z.number().default(100),
    windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
    enableHelmet: z.boolean().default(true),
  }),
  remote: z.object({
    enableWakeOnLan: z.boolean().default(true),
    allowSystemControl: z.boolean().default(true),
    trustedNetworks: z.array(z.string()).default(['127.0.0.1', '::1']),
  }),
  monitoring: z.object({
    enableDetailedMetrics: z.boolean().default(true),
    refreshInterval: z.number().default(5000), // 5 seconds
    enableAlerts: z.boolean().default(true),
  }),
});

export const config = configSchema.parse({
  server: {
    name: process.env.SERVER_NAME || 'PULSE',
    version: process.env.SERVER_VERSION || '2.0.0',
    port: parseInt(process.env.PORT || '3000'),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    tokenExpiry: process.env.TOKEN_EXPIRY || '24h',
  },
  security: {
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    maxRequests: parseInt(process.env.MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
  },
  remote: {
    enableWakeOnLan: process.env.ENABLE_WAKE_ON_LAN !== 'false',
    allowSystemControl: process.env.ALLOW_SYSTEM_CONTROL !== 'false',
    trustedNetworks: process.env.TRUSTED_NETWORKS?.split(',') || ['127.0.0.1', '::1'],
  },
  monitoring: {
    enableDetailedMetrics: process.env.ENABLE_DETAILED_METRICS !== 'false',
    refreshInterval: parseInt(process.env.MONITORING_REFRESH || '5000'),
    enableAlerts: process.env.ENABLE_ALERTS !== 'false',
  },
});

export type Config = typeof config;