import crypto from "crypto";
import { Redis } from "ioredis";
import { config } from "./config.ts";

export const cacheRedis = new Redis(config.REDIS_URL, {
    keyPrefix: "docuchat:",
});

export const CACHE_TTL = {
    PERMISSIONS: 300,
    DOCUMENT: 600,
    CONVERSATION_LIST: 120,
    EMBEDDING: 604800,
    RAG_RESULT: 3600,
};

export async function cacheGet<T>(key:string): Promise<T | null> {
    const raw = await cacheRedis.get(key);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export async function cacheSet<T>(
    key: string,
    value: T,
    ttlSeconds: number
) {
    await cacheRedis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string) {
    await cacheRedis.del(key);
}

export async function cacheDelPattern(pattern: string) {
    const stream = cacheRedis.scanStream({ match: pattern, count: 100 });
    const pipeline = cacheRedis.pipeline();

    for await (const keys of stream) {
        for (const key of keys) {
            pipeline.del(key);
        }
    }

    await pipeline.exec();
}

export function hashkey(parts: string[]) {
    const data = parts.join(":");
    return crypto.createHash("sha256")
        .update(data)
        .digest("hex")
        .substring(0, 16);
}

