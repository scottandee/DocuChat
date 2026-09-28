import { Redis } from "ioredis";
import { config } from "../lib/config.ts";

export const redisConnection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
});