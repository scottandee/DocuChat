import { config } from "./config.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client.ts";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
    adapter,
    log: 
    config.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
});

export { prisma };