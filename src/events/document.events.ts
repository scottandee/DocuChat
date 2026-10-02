import { appEvents } from "../lib/events.ts";
import { logger } from "../lib/logger.ts";
import { prisma } from "../lib/prisma.ts";

export const DOC_EVENTS = {
    CREATED: "document:created",
    PROCESSED: "document:processed",
    DELETED: "document:deleted",
};

appEvents.on(DOC_EVENTS.CREATED, async (data) => {
    try {
        await prisma.usageLog.create({
            data: {
                userId: data.userId,
                action: "document_created",
                tokens: 0,
                costUsd: 0,
                metadata: JSON.stringify({
                    documentId: data.documentId,
                    title: data.title,
                    fileSizeBytes: data.fileSizeBytes,
                }),
            },
        });
    } catch (error) {
        logger.error("Failed to log document creation", {
            correlationId: data.correlationId,
            userId: data.userId,
            documentId: data.documentId,
            event: DOC_EVENTS.CREATED,
            error,
        });
    }
});

appEvents.on(DOC_EVENTS.DELETED, async (data) => {
    try {
        await prisma.usageLog.create({
            data: {
                userId: data.deletedBy,
                action: "document_deleted",
                tokens: 0,
                costUsd: 0,
                metadata: JSON.stringify({
                    documentId: data.documentId,
                    title: data.title,
                    deletedAt: new Date().toISOString(),
                }),
            },
        });
    } catch (error) {
        logger.error("Failed to log document deletion", {
            correlationId: data.correlationId,
            userId: data.deletedBy,
            documentId: data.documentId,
            event: DOC_EVENTS.DELETED,
            error,
        });
    }
});