import { cacheDel } from "../lib/cache.ts";
import { appEvents } from "../lib/events.ts";
import { logger } from "../lib/logger.ts";
import { ADMIN_EVENTS } from "./admin.events.ts";
import { DOC_EVENTS } from "./document.events.ts";

appEvents.on(ADMIN_EVENTS.ROLE_ASSIGNED, async (data) => {
    try {
        await cacheDel(`permissions:${data.targetUserId}`);

        logger.info("Permissions cache invalidated", {
            correlationId: data.correlationId,
            userId: data.targetUserId,
            cacheKey: `permissions:${data.targetUserId}`,
            event: ADMIN_EVENTS.ROLE_ASSIGNED,
        });
    } catch (error) {
        logger.error("Failed to invalidate permissions cache", {
            correlationId: data.correlationId,
            userId: data.targetUserId,
            event: ADMIN_EVENTS.ROLE_ASSIGNED,
            error,
        });
    }
});

appEvents.on(ADMIN_EVENTS.ROLE_REVOKED, async (data) => {
    try {
        await cacheDel(`permissions:${data.targetUserId}`);

        logger.info("Permissions cache invalidated", {
            correlationId: data.correlationId,
            userId: data.targetUserId,
            cacheKey: `permissions:${data.targetUserId}`,
            event: ADMIN_EVENTS.ROLE_REVOKED,
        });
    } catch (error) {
        logger.error("Failed to invalidate permissions cache", {
            correlationId: data.correlationId,
            userId: data.targetUserId,
            event: ADMIN_EVENTS.ROLE_REVOKED,
            error,
        });
    }
});

appEvents.on(DOC_EVENTS.DELETED, async (data) => {
    try {
        await cacheDel(`documents:${data.documentId}`);

        logger.info("Document cache invalidated", {
            correlationId: data.correlationId,
            documentId: data.documentId,
            cacheKey: `documents:${data.documentId}`,
            event: DOC_EVENTS.DELETED,
        });
    } catch (error) {
        logger.error("Failed to invalidate document cache", {
            correlationId: data.correlationId,
            documentId: data.documentId,
            event: DOC_EVENTS.DELETED,
            error,
        });
    }
});