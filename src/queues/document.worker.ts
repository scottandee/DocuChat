import { Worker, type Job } from "bullmq";
import { redisConnection } from "./connection.ts";
import { prisma } from "../lib/prisma.ts";
import { estimateTokens, splitIntoChunks } from "../lib/chunker.ts";
import { appEvents } from "../lib/events.ts";
import { DOC_EVENTS } from "../events/document.events.ts";
import { deadLetterQueue } from "./dead-letter.queue.ts";

const worker = new Worker(
    "document-processing",
    async (job: Job) => {
        const { documentId, userId } = job.data;
        console.log(`Processing document ${documentId} (attempt ${job.attemptsMade + 1})`);

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
            if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
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
    console.log(`Job ${job.id} completed: ${job.returnvalue.chunks} chunks`);
})

worker.on("failed", async (job, error) => {
    if (!job) return;

    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
        console.error(`Job ${job?.id} failed: (attempts ${job?.attemptsMade}):`, error.message);
        
        await deadLetterQueue.add("failed-document", {
            originalJobId: job.id,
            OriginalQueue: "document-processing",
            data: job.data,
            error: error.message,
            failedAt: new Date().toISOString(),
            attempts: job.attemptsMade,
        });
    }
});

worker.on("error", (error) => {
    console.error("Worker error: ", error);
});

export { worker };