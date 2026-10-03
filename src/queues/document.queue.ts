import { Queue } from "bullmq";
import { redisConnection } from "./connection.ts";

export const documentQueue = new Queue("document-processing", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 }
    },
});

export async function queueDocumentForProcessing(
    documentId: string, userId: string, correlationId: string
) {
    const job = await documentQueue.add(
        "process-document",
        { documentId, userId, correlationId, queuedAt: Date.now() },
    );

    return job.id;
}