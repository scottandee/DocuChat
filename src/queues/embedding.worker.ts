import { Worker } from "bullmq";
import { openaiBreaker } from "../lib/http/openai.breaker.ts";
import { redisConnection } from "./connection.ts";

const worker = new Worker(
    "embedding-generation",
    async (job) => {
        return openaiBreaker.fire('/embeddings', {
            input: job.data.text,
            model: 'text-embedding-3-small',  
        });
    },
    {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
            max: 100,
            duration: 60000,
        },
    }
)

export { worker };