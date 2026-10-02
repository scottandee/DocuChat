import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.ts";

declare module "express-serve-static-core" {
    interface Request {
        correlationId?: string;
  }
}

export function requestLogger(
    req: Request, res: Response, next: NextFunction
) {
    const correlationId = req.headers["x-correlation-id"] as string 
        || randomUUID();
    
    req.correlationId = correlationId;
    res.setHeader("X-Correlation-Id", correlationId);

    const startTime = Date.now();

    logger.http("Request Recieved", {
        correlationId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    });

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        const logData = {
            correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.user?.id,
        };

        if (res.statusCode >= 500) {
            logger.error("Request failed", logData);
        } else if (res.statusCode >= 400) {
            logger.warn("Request completed with client error", logData);
        } else {
            logger.info("Request completed", logData);
        }
    });

    next();
}