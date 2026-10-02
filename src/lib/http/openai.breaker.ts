import CircuitBreaker from "opossum";
import { openaiClient } from "./openai.client.ts";
import { withRetry } from "./retry.ts";
import { logger } from "../logger.ts";

async function callOpenAI<TBody>(path: string, body: TBody) {
    return withRetry(() => openaiClient.post(path, body));
}

export const openaiBreaker = new CircuitBreaker(callOpenAI, {
    timeout: 35000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 60000,
    rollingCountBuckets: 10,
});

openaiBreaker.fallback(() => {
    throw new Error("OpenAI is temporarily unavaliable. Please try again shortly");
});

openaiBreaker.on("open", () => {
    logger.warn("OpenAI circuit breaker OPENED", {
        dependency: "openai",
        state: "open"
    });
});

openaiBreaker.on("halfOpen", () => {
    logger.warn("OpenAI circuit breaker HALF-OPEN", {
        dependency: "openai",
        state: "half-open",
    });
});

openaiBreaker.on("close", () => {
    logger.info("OpenAI circuit breaker CLOSED", {
        dependency: "openai",
        state: "closed",
    });
});