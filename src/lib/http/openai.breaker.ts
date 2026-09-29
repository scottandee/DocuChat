import CircuitBreaker from "opossum";
import { openaiClient } from "./openai.client.ts";
import { withRetry } from "./retry.ts";

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
    console.warn("OpenAI circuit breaker OPENED - requests will fail fast");
});

openaiBreaker.on("halfOpen", () => {
    console.warn("OpenAI circuit breaker HALF-OPEN - testing recovery");
});

openaiBreaker.on("close", () => {
    console.log("OpenAI circuit breaker CLOSED - normal operation");
});