import type { NextFunction, Request, Response } from "express";
import { assignRole, fetchRoles, revokeRole } from "../services/admin.service.ts";

export async function fetchRolesController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const roles = await fetchRoles();
        res.json(roles);
    } catch (error) {
        next(error);
    }
}

export async function assignRoleController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await assignRole({
            userId: req.params.userId,
            assignedBy: req.user?.id,
            ...req.body,
        });
        res.json(result);
    } catch (error) {
        next(error)
    }
}

export async function revokeRoleController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await revokeRole({
            userId: req.params.userId,
            roleName: req.params.roleName,
            ...req.body,
         });
        res.json(result);
    } catch (error) {
        next(error)
    }
}