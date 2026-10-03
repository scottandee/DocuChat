import { Worker, type Job } from "bullmq";
import { redisConnection } from "./connection.ts";
import { prisma } from "../lib/prisma.ts";
import { estimateTokens, splitIntoChunks } from "../lib/chunker.ts";
import { appEvents } from "../lib/events.ts";
import { DOC_EVENTS } from "../events/document.events.ts";
import { deadLetterQueue } from "./dead-letter.queue.ts";
import { logger } from "../lib/logger.ts";

const worker = new Worker(
    "document-processing",
    async (job: Job) => {
        const { documentId, userId, correlationId } = job.data;

        logger.info("Document processing started", {
            correlationId,
            jobId: job.id,
            documentId,
            userId,
            attempt: job.attemptsMade + 1,
        });

        const document = await prisma.document.findUniqueOrThrow({
            where: { id: documentId },
        });

        await prisma.document.update({
            where: { id: documentId },
            data: {
                status: "processing",
            }
        });

        try {
            await job.updateProgress(10);

            const chunks = splitIntoChunks(document.content, 500);

            // store chunks in db
            await prisma.$transaction(async (tx) => {
                await tx.chunk.deleteMany({ where: { documentId } });
                await tx.chunk.createMany({
                    data: chunks.map((text, index) => ({
                        documentId,
                        index,
                        content: text,
                        tokenCount: estimateTokens(text),
                    })),
                });
                await tx.document.update({
                    where: { id: documentId },
                    data: { status: "ready", chunkCount: chunks.length },
                });
            });

            job.updateProgress(100);

            appEvents.emit(DOC_EVENTS.PROCESSED, {
                documentId,
                userId,
                chunksCount: chunks.length,
            });

            return { success: true, chunks: chunks.length };

        } catch(error) {
            const maxAttempts = (job.opts.attempts ?? 3);
            const isFinalAttempt = job.attemptsMade >= maxAttempts - 1;

            logger.error("Document processing failed", {
                correlationId,
                jobId: job.id,
                documentId,
                userId,
                attempt: job.attemptsMade + 1,
                maxAttempts,
                isFinalAttempt,
                error,
            });

            if (isFinalAttempt) {
                await prisma.document.update({
                    where: { id: documentId },
                    data: { status: "failed", error: (error as Error).message },
                });
            }
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 3,
    }
);

worker.on("completed", (job) => {
    logger.info("Document processing job completed", {
        correlationId: job.data.correlationId,
        jobId: job.id,
        documentId: job.data.documentId,
        userId: job.data.userId,
        chunks: job.returnvalue?.chunks,
    });
});

worker.on("failed", async (job, error) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 3;
    const isFinalAttempt = job.attemptsMade >= maxAttempts;
    if (!isFinalAttempt) {
        logger.warn("Document processing job will be retried", {
            correlationId: job.data.correlationId,
            jobId: job.id,
            documentId: job.data.documentId,
            attempt: job.attemptsMade,
            maxAttempts,
            error,
        });

        return;
    }
    
    logger.error("Document processing job permanently failed", {
        correlationId: job.data.correlationId,
        jobId: job.id,
        documentId: job.data.documentId,
        attempts: job.attemptsMade,
        error,
    });
        
    await deadLetterQueue.add("failed-document", {
        originalJobId: job.id,
        originalQueue: "document-processing",
        data: job.data,
        error: error.message,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade,
    });
});

worker.on("error", (error) => {
    logger.error("Document processing worker error", {
        error,
    });
});

export { worker };