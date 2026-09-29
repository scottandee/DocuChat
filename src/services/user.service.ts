import { appEvents } from "../lib/events.ts";
import { NotFoundError } from "../lib/errors.ts";
import { prisma } from "../lib/prisma.ts";
import { CACHE_TTL, cacheGet, cacheSet } from "../lib/cache.ts";

export async function getUserPermissions(
    userId: string
): Promise<Set<string>> {
    const cacheKey = `permssions:${userId}`;

    const cached = await cacheGet<string[]>(cacheKey);
    if (cached) {
        return new Set(cached);
    }

    const roles = await prisma.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            }
        }
    });

    const permissions = new Set<string>();
    for (const ur of roles) {
        for (const rp of ur.role.permissions) {
            permissions.add(rp.permission.name);
        }
    }

    await cacheSet(cacheKey, [...permissions], CACHE_TTL.PERMISSIONS);

    return permissions;
}

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

    appEvents.emit("admin:role-assigned", {
        targetUserId: data.userId,
        roleName: data.roleName,
        assignedBy: data.assignedBy,
    })

    return {
        success: true,
        data: { message: `Role '${data.roleName}' assigned to user`},
    };
}

export async function revokeRole(data: {
    userId: string, revokedBy: string, roleName: string,
}) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundError("User not found");

    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) throw new NotFoundError("Role not found");

    await prisma.userRole.deleteMany({
        where: { userId:  data.userId, roleId: role.id },
    });

    appEvents.emit("admin:role-revoked", {
        targetUserId: data.userId,
        roleName: data.roleName,
        revokedBy: data.revokedBy,
    });

    return {
        success: true,
        data: { message: `Role '${data.roleName}' revoked`},
    };
}