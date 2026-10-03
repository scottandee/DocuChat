import { Router, type Request, type Response } from "express";
import { config } from "../lib/config.ts";
import { prisma } from "../lib/prisma.ts";
import { cacheRedis } from "../lib/cache.ts";

const router = Router();

router.get("/live", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        uptime: process.uptime(),
    });
});

router.get("/ready", async (req: Request, res: Response) => {
    const checks: Record<string, { status: string, message?: string }> = {};

    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = { status: "ok" };
    } catch(error) {
        checks.database = {
            status: "error",
            message: (error as Error).message,
        };
    }

    try {
        await cacheRedis.ping();
        checks.redis = { status: "ok" };
    } catch(error) {
        checks.redis = {
            status: "error",
            message: (error as Error).message,
        };
    }

    const allHealthy = Object.values(checks).every(
        c => c.status === "ok"
    );

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? "okay" : "degraded",
        timestamp: new Date().toISOString(),
        checks,
    });
});

export default router;