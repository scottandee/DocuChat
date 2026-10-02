import type { NextFunction, Request, Response } from "express";
import { createDocument, deleteDocument, getDocProcessingStatus, getDocument, listDocuments } from "../services/document.service.ts";

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

export async function getDocumentController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const document = await getDocument({
            userId: req.user!.id,
            documentId: req.params.documentId,
            ...req.body
        });

        res.setHeader("Cache-Control", "private, max-age=600");
        res.json(document);
    } catch (error) {
        next(error)
    }
}

export async function deleteDocumentController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await deleteDocument({
            userId: req.user!.id,
            documentId: req.params.documentId,
            correlationId: req.correlationId,
            ...req.body
        });
        return res.json(result);
    } catch(error) {
        next(error);
    }
}

export async function createDocumentCOntroller(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await createDocument({
            correlationId: req.correlationId,
            ...req.body, userId: req.user!.id  
        });
        return res.status(202).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getDocProcessingStatusController(
    req: Request, res: Response, next: NextFunction
) {
    try {
        const result = await getDocProcessingStatus({
            userId: req.user!.id,
            documentId: req.params.documentId,
            ...req.body,
        });
        return res.json(result);
    } catch(error) {
        next(error);
    }
}