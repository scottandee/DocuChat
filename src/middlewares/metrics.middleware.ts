import type { NextFunction, Request, Response } from "express";
import { httpRequestDuration, httpRequestsTotal } from "../lib/metrics.ts";

export function metricsMiddleware(
    req: Request, res: Response, next: NextFunction
) {
    const end = httpRequestDuration.startTimer({
        method: req.method,
        path: normalizePath(req.route?.path || req.path),
    });

    res.on("finish", () => {
        httpRequestsTotal.inc({
            method: req.method,
            path: normalizePath(req.route?.path || req.path),
            status_code: res.statusCode.toString(), 
        });
        end();
    });

    next();
}

function normalizePath(path: string) {
    return path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
      ':id'
    )
    .replace(/\/\d+/g, '/:num');
}