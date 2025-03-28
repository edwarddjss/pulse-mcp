import { z } from "zod";
import { SystemStatusService } from "../services/systemStatus.js";

const statusService = new SystemStatusService();

const schema = {};

export const systemStatusTool = {
    name: "system-status",
    description: "Get the current status of the system",
    schema,
    handler: async () => {
        const status = await statusService.getStatus();
        return status;
    }
};