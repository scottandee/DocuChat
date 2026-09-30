import type { NextFunction, Request, Response } from "express";
import { cacheRedis } from "../lib/cache.ts";

export async function trackSuspiciousDocumentAccess(
    req: Request, res: Response, next: NextFunction
) {
    const userId = req.user?.id;
    if (!userId) return next();

    const key = `access-pattern:${userId}`;
    const documentId = req.params.documentId;

    if (documentId) {
        await cacheRedis.sadd(key, documentId as string);
        await cacheRedis.expire(key, 300);

        const uniqueDocs = await cacheRedis.scard(key);
        if (uniqueDocs > 50) {
            console.warn(
                `Suspicious: user ${userId} accessed ${uniqueDocs} in 5 min`
            );
        }
    }
    next();
} 