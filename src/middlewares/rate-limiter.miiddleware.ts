import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore, { type RedisReply } from "rate-limit-redis";
import { cacheRedis } from "../lib/cache.ts";

function createRateLimiter (options: {
    windowMs: number,
    max: number | ((req: Request) => number),
    message: string,
    keyGenerator?: (req: Request) => string 
}) {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
            sendCommand: (command: string, ...args: string[]) => 
                cacheRedis.call(command, ...args) as Promise<RedisReply>,
        }),
        message: {
            success: false,
            error: {
                code: "RATE_LIMITED",
                message: options.message,
            },
        },
        keyGenerator: options.keyGenerator ||
            ((req: Request) => req.user?.id || (req.ip ? ipKeyGenerator(req.ip) : "anonymous")),
    });
}

export const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many attempts. Try again later",
    keyGenerator: (req) => req.ip ? ipKeyGenerator(req.ip) : "anonymous",
});

export const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: (req: Request) => {
        const tier = req.user?.tier || "free";
        const limits: Record<string, number> = {
            free: 100,
            pro: 500,
            enterprise: 2000,
        }
        return limits[tier] || 100;
    },
    message: "Rate limit exceeded. Please try again later",
});

export const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: (req: Request) => {
        const tier = req.user?.tier || "free";
        const limits: Record<string, number> = {
            free: 5,
            pro: 50,
            enterprise: 500,
        };
        return limits[tier] || 5;
    },
    message: "Upload limit reached. Please try again later",
});

export const chatLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: (req: Request) => {
        const tier = req.user?.tier || "free";
        const limits: Record<string, number> = {
            free: 10,
            pro: 30,
            enterprise: 100,
        };
        return limits[tier] || 10;
    },
    message: "Too many queries. Please slow down",
});