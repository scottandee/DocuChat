import type { Prisma } from "../../prisma/generated/client.ts";
import { prisma } from "../lib/prisma.ts";

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