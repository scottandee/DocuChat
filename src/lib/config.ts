import dotenv from "dotenv";
import * as z from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["production", "development", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET should be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET should be at least 32 characters long"),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
    OPENAI_API_URL: z.string().optional(),
    REDIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env)

if (!parsed.success)
{
    console.error("Invalid Environment variables");
    console.error(parsed.error.issues);
    throw new Error("Invalid environment variables");
}

export const config = parsed.data;

