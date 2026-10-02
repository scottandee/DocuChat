import { AxiosError } from "axios";
import { logger } from "../logger.ts";

function isRetryable(error: AxiosError): boolean {
    if (!error.response) return true;

    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
    operation: () => Promise<T>,
    options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
    const { maxAttempts = 3, baseDelayMs = 1000 } = options;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch(error) {
            lastError = error;

            if (!(error instanceof AxiosError) || !isRetryable(error)) {
                throw error;
            }

            if (attempt === maxAttempts) {
                throw error;
            }

            const retryAfter = error.response?.headers["retry-after"];
            const delayMs = retryAfter
                ? parseInt(retryAfter) * 1000
                : baseDelayMs * Math.pow(2, attempt - 1);

            logger.warn("Retrying failed HTTP request", {
                attempt,
                maxAttempts,
                delayMs: Math.round(delayMs),
                statusCode: error.response?.status,
                errorCode: error.code,
                message: error.message,
                stack: error.stack,
            });
            
            await delay(delayMs);
        }
    }
    throw lastError;
}