import z from "zod";

export const listDocumentsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum(["pending", "processing", "ready", "failed"]).optional(),
        search: z.string().max(200).optional(),
        sortBy: z.enum(["createdAt", "title", "chunkCount"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
});