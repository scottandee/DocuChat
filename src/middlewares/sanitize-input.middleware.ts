import type { NextFunction, Request, Response } from "express";
import xss from "xss";

function sanitizeValue<T>(value: T): T {
    if (typeof value === "string") {
        return xss(value, {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ["script", "style"],
        }) as T;
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue) as T;
    }

    if (value && typeof value === "object") {
        const clean: Record<string, unknown> = {};
        for (const key of Object.keys(value)) {
            clean[key] = sanitizeValue(
                (value as Record<string, unknown>)[key]
            );
        }
        return clean as T;
    }
    return value;
}

export function sanitizeInput(
    req: Request, res: Response, next: NextFunction
) {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.params) req.params = sanitizeValue(req.params);
    if (req.query)  {
        Object.defineProperty(req, "query", {
            configurable: true,
            enumerable: true,
            value: sanitizeValue(req.query),
        });
    }
    next();
}