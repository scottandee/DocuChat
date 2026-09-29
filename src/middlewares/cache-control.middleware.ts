import type { NextFunction, Request, Response } from "express";

export function noStore(
    req: Request, res: Response, next: NextFunction
) {
    res.setHeader("Cache-Control", "no-store");
    next();
}

export function noCache(
    req: Request, res: Response, next: NextFunction
) {
    res.setHeader("Cache-Control", "no-cache");
    next();
}