import { Queue } from "bullmq";
import { redisConnection } from "./connection.ts";

export const embeddingQueue = new Queue("embedding-generation", {
    connection: redisConnection,
});