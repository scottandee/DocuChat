import type { 
    AxiosError,
    AxiosInstance, 
    AxiosResponse, 
    InternalAxiosRequestConfig
} from "axios";
import axios from "axios";
import { config } from "../config.ts";

declare module "axios" {
    export interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
        },
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
    config.metadata = { startTime };
    console.log(`OpenAI ${config.method?.toUpperCase} ${config.url}`)
    return config;
});

openaiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        const startTime = response.config.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime: 0;
        console.log(
            `OpenAI ${response.status} ${response.config.url} ${duration}ms`
        );
        return response
    },
    (error: AxiosError) => {
        const startTime = error.config?.metadata?.startTime;
        const duration = startTime ? Date.now() - startTime: 0;

        if (error.response) {
            console.error(
                `OpenAI ${error.response.status} ${error.config?.url}`
            );
        } else if (error.request) {
            console.error(
                `OpenAI no response ${error.config?.url} ${duration}ms`
            );
        } else {
            console.error("OpenAI request setup error:", error.message);
        }

        return Promise.reject(error);
    },
);