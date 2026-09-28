import { prisma } from "../lib/prisma.ts";

export async function listConversations (
    userId: string,
    options: { page: number, limit: number }
) {
    const { page, limit } = options;
    const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: {
                        content: true,
                        role: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: { messages: true },
                }
            },
        }),

        prisma.conversation.count({ where: { userId } }),
    ]);

    return {
        success: true,
        data: conversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            messageCount: conv._count,
            lastMessage: conv.messages[0] || null,
            updatedAt: conv.updatedAt,
        })),
        meta: {
            page,
            limit,
            total,
        }
    }
}