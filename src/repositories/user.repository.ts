import { prisma } from "../lib/prisma.ts"

export const userRepository = {
    async findById(id: string) {
        return await prisma.user.findUnique({
            where: { id },
        });
    },

    async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        });
    },

    async create(data: {
        email: string,
        passwordHash: string,
    }) {
        return prisma.user.create({ data });
    },

    async updateById(id: string, data: {
        name: string,
        email: string,
        isActive: boolean,
    }) {
        return prisma.user.update({
            where: { id },
            data
        });
    },

    async softDelete(id: string) {
        return prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },
}