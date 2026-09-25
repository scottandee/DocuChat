import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens.ts";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.ts";
import { getUserPermissions } from "../services/rbac.service.ts";


declare module "express-serve-static-core" {
    interface Request {
        user?: { id: string, role: string };
  }
}

export function authenticate(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            throw new UnauthorizedError("No token provided");
        }

        const token = header.split(" ")[1];

        try {
            const payload = verifyAccessToken(token);
            if (payload.type != "access") {
                throw new UnauthorizedError("Invalid token type");
            }

            req.user = { id: payload.sub, role: payload.role };
            next();
        }
        catch (error: unknown) {
            if (error instanceof Error && error.name === "TokenExpiredError") {
                throw new UnauthorizedError("Token expired");
            }
            throw new UnauthorizedError("Invalid token");
        }
    } catch (error) {
        next(error);
    }
}

export function requirePermission(
    ...requiredPermissions: string[]
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new UnauthorizedError("Not authenticated");
            }

            const userPermissions = await getUserPermissions(req.user.id);
            
            const missing = requiredPermissions.filter(
                (p) => !userPermissions.has(p)
            );
            if (missing.length > 0) {
                throw new ForbiddenError("You do not have the required permission");
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}