import type { NextFunction, Request, Response } from "express";
import { listConversations } from "../services/conversation.service.ts";

export async function listConversationsController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const conversations = await listConversations(
            req.user!.id,
            { page: Number(req.query.page), limit: Number(req.query.limit) },
        );
        return res.json(conversations);
    }
    catch (error) {
        next(error);
    }
}