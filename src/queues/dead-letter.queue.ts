import { Queue } from "bullmq";
import { redisConnection } from "./connection.ts";

export const deadLetterQueue = new Queue("dead-letter", {
    connection: redisConnection,
})