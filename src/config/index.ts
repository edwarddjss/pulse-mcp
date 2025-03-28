import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    server: {
        name: "PULSE",
        version: "0.1.0"
    },
    target: {
        name: process.env.TARGET_PC_NAME,
        mac: process.env.TARGET_PC_MAC,
        ip: process.env.TARGET_PC_IP
    }
};