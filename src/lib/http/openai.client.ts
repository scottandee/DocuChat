import type { 
    AxiosError,
    AxiosInstance, 
    AxiosResponse, 
    InternalAxiosRequestConfig
} from "axios";
import axios from "axios";
import { config } from "../config.ts";
import { logger } from "../logger.ts";

declare module "axios" {
    export interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
            correlationId?: string;
        },
        correlationId?: string;
    }
};

export const openaiClient: AxiosInstance = axios.create({
    baseURL: "https://api.openai.com/v1",
    timeout: 30000,
    headers: {
        "Authorization": `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "DocuChat/1.0",
    },
});

openaiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const startTime = Date.now();
    config.metadata = { startTime, correlationId: config.correlationId };
    
    logger.debug("OpenAI request started", {
        correlationId: config.correlationId,
        method: config.method?.toUpperCase(),
        url: config.url,
    });
    
    return config;
});

openaiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        const startTime = response.config.metadata?.startTime;
        const durationMs = startTime ? Date.now() - startTime: 0;
        
        logger.info("OpenAI request completed", {
            correlationId: response.config.metadata?.correlationId,
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            statusCode: response.status,
            durationMs,
        });
        
        return response
    },
    (error: AxiosError) => {
        const startTime = error.config?.metadata?.startTime;
        const durationMs = startTime ? Date.now() - startTime: 0;
        const correlationId = error.config?.metadata?.correlationId;

        if (error.response) {
           logger.error("OpenAI request failed", {
                correlationId,
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                statusCode: error.response.status,
                durationMs,
                errorCode: error.code,
                message: error.message,
                stack: error.stack,
            });
        } else if (error.request) {
            logger.error("OpenAI request received no response", {
                correlationId,
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                durationMs,
                errorCode: error.code,
                message: error.message,
                stack: error.stack,
            });
        } else {
            logger.error("OpenAI request setup failed", {
                correlationId,
                method: error.config?.method?.toUpperCase(),
                url: error.config?.url,
                errorCode: error.code,
                message: error.message,
                stack: error.stack,
            });
        }

        return Promise.reject(error);
    },
);

openaiClient.interceptors.response.use((response: AxiosResponse) => {
    const remaining = parseInt(
        response.headers["x-ratelimit-remaining-requests"] || "999"
    );

    if (remaining < 50) {
        console.warn(`OpenAI rate limit getting low: ${remaining} remaining`);
    }

    return response;
});