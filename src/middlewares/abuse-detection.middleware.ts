import type { NextFunction, Request, Response } from "express";
import { cacheRedis } from "../lib/cache.ts";
import { logger } from "../lib/logger.ts";

const DOCUMENT_THRESHOLD = 50;
const WINDOW_SECONDS = 300;

export async function trackSuspiciousDocumentAccess(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const userId = req.user?.id;
    const documentId = req.params.documentId;

    if (!userId || !documentId) {
        return next();
    }

    const key = `access-pattern:${userId}`;
    const alertKey = `access-pattern-alert:${userId}`;

    try {
        await cacheRedis.sadd(key, documentId as string);
        await cacheRedis.expire(key, WINDOW_SECONDS);

        const uniqueDocs = await cacheRedis.scard(key);

        if (uniqueDocs > DOCUMENT_THRESHOLD) {
            const alertCreated = await cacheRedis.set(
                alertKey,
                "1",
                "EX",
                WINDOW_SECONDS,
                "NX"
            );

            if (alertCreated === "OK") {
                logger.warn("Suspicious document access pattern", {
                    correlationId: req.correlationId,
                    userId,
                    uniqueDocumentCount: uniqueDocs,
                    threshold: DOCUMENT_THRESHOLD,
                    windowSeconds: WINDOW_SECONDS,
                });
            }
        }
    } catch (error) {
        logger.error("Failed to track document access pattern", {
            correlationId: req.correlationId,
            userId,
            error,
        });
    }

    return next();
}