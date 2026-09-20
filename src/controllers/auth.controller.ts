import type { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service.ts"

export async function registerController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const user = await authService.register({ ...req.body });
        res.status(201).json(user);
    }
    catch(error) {
        next(error);
    } 
}

export async function loginController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await authService.login({
            ...req.body,
            deviceInfo: req.headers["user-agent"],
        });
        res.status(200).json(result);
    }
    catch(error) {
        next(error);
    }
}

export async function refreshTokenController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await authService.refresh(req.body.refreshToken);
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
}

export async function logoutController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await authService.logout(req.body.refreshToken);
        res.status(200).json(result);
    } catch (error) {
        next(error)
    }
}