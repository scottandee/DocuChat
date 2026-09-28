import type { NextFunction, Request, Response } from "express";
import { listDocuments } from "../services/document.service.ts";

export async function listDocumentsController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const documents = await listDocuments(
            req.user!.id,
            {
                page: Number(req.query.page),
                limit: Number(req.query.limit),
                ...req.query,
            },
        );
        return res.json(documents);
    }
    catch (error) {
        next(error);
    }
}