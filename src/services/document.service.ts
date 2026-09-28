import type { Prisma } from "../../prisma/generated/client.ts";
import { DOC_EVENTS } from "../events/document.events.ts";
import { NotFoundError } from "../lib/errors.ts";
import { appEvents } from "../lib/events.ts";
import { prisma } from "../lib/prisma.ts";
import { getUserPermissions } from "./user.service.ts";

export const DOC_MESSAGES = {
    NOT_FOUND: "Document not found",
}

export async function listDocuments (
    userId: string,
    options: {
        page: number,
        limit: number,
        status?: string,
        search?: string
        sortBy?: "createdAt" | "updatedAt" | "title",
        sortOrder?: string,
    }
) {
    const {
        page, limit,
        status, search,
        sortBy = "createdAt", sortOrder,
    } = options;

    const orderBy: Prisma.DocumentOrderByWithRelationInput = { [sortBy] : sortOrder };
    const where: Prisma.DocumentWhereInput = {
        userId,
        deletedAt: null,
    }
    
    if (status) {
        where.status = status;
    }
    
    if (search) {
        where.title = { contains: search, mode: "insensitive" };
        where.description = { contains: search, mode: "insensitive"};
    }

    const [documents, total] = await Promise.all([
        prisma.document.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                filename: true,
                status: true,
                chunkCount: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.document.count({ where }),
    ]);

    return {
        success: true,
        data: documents,
        meta: { page, limit, total },
    }
}

export async function getDocument(data: {
     userId: string, documentId: string
}) {
    const document = await prisma.document.findUnique({
        where: { id: data.documentId },
    });

    if (!document) throw new NotFoundError(DOC_MESSAGES.NOT_FOUND);

    if (document.userId !== data.userId) {
        const permissions = await getUserPermissions(data.userId);
        if (!permissions.has("users:manage")) {
            throw new NotFoundError(DOC_MESSAGES.NOT_FOUND)
        }
    }

    return { success: true, data: document };
}

export async function deleteDocument(data: {
     userId: string, documentId: string
}) {
    const document = await prisma.document.findUnique({
        where: { id: data.documentId },
    });

    if (!document || document.deletedAt) {
        throw new NotFoundError(DOC_MESSAGES.NOT_FOUND);
    }

    if (document.userId !== data.userId) {
        throw new NotFoundError(DOC_MESSAGES.NOT_FOUND);
    }

    const result = prisma.document.update({
        where: { id: data.documentId },
        data: {
            deletedAt: new Date(),
            deletedBy: data.userId,
        },
    });

    appEvents.emit(DOC_EVENTS.DELETED, {
        deletedBy: data.userId,
        documentId: data.documentId,
        title: document.title,
    });

    return result;
}