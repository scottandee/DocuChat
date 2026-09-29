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

// Used for the prevention of a Cache Stampede
export async function cacheGetOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
) {
    const cached = await cacheGet<T>(key);
    if (cached) return cached;

    const lockKey = `lock:${key}`;
    const acquired = await cacheRedis.set(
        lockKey, "1", "EX", 5, "NX"
    );

    if (acquired) {
        try {
            const value = await fetchFn();
            await cacheSet(key, value, ttlSeconds);
            return value;
        } finally {
            await cacheDel(lockKey);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    const retried = await cacheGet<T>(key);
    if (retried) return retried;

    return fetchFn();
}