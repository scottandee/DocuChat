import { NotFoundError } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";

export async function fetchRoles() {
    const roles = await prisma.role.findMany({
        include: {
            permissions: { include: { permission: true } },
            _count: { select: { users: true } }
        },
    });

    return {
        success: true,
        data: roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            isDefault: role.isDefault,
            userCount: role._count.users,
            permissions: role.permissions.map((rp) => rp.permission.name),
        })),
    }
}

export async function assignRole(data: {
    userId: string, assignedBy: string, roleName: string,
}) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundError("User not found");

    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) throw new NotFoundError("Role not found");

    await prisma.userRole.upsert({
        where: { userId_roleId: { userId:  data.userId, roleId: role.id } },
        update: {},
        create: {
            userId: data.userId,
            roleId: role.id,
            assignedBy: data.assignedBy,
        }
    });

    return {
        success: true,
        data: { message: `Role '${data.roleName}' assigned to user`},
    };
}

export async function revokeRole(data: {
    userId: string, roleName: string,
}) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundError("User not found");

    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) throw new NotFoundError("Role not found");

    await prisma.userRole.deleteMany({
        where: { userId:  data.userId, roleId: role.id },
    });

    return {
        success: true,
        data: { message: `Role '${data.roleName}' revoked`},
    };
}