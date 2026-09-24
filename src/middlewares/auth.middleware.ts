import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens.ts";


declare module "express-serve-static-core" {
    interface Request {
        user?: { id: string, role: string };
  }
}

export function authenticate(
    req: Request, res: Response
) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);
        if (payload.type != "access") {
            return res.status(401).json({ error: "Invalid token type" });
        }
    }
    catch (error: unknown) {
        if (error instanceof Error && error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
}

export function authorize(
    ...allowedRoles: string[]
) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}