import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
    interface Request {
        fingerprint?: string;
  }
}

export function attachFingerprint(
    req: Request, res: Response, next: NextFunction
) {
    const signals = [
        req.ip,
        req.headers["user-agent"] || " ",
        req.headers["accept-language"] || " ",
        req.headers["accept-encoding"] || " ",
    ];

    const fingerprint = crypto
        .createHash("sha256")
        .update(signals.join("|"))
        .digest("hex")
        .substring(0, 16);

    req.fingerprint = fingerprint;
    next();
}