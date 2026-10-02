import crypto from "crypto"
import { hashPassword, verifyPassword } from "../lib/password.ts";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/tokens.ts";
import { userRepository } from "../repositories/user.repository.ts";
import { prisma } from "../lib/prisma.ts";
import { ConflictError, UnauthorizedError } from "../lib/errors.ts";
import { appEvents } from "../lib/events.ts";
import { AUTH_EVENTS } from "../events/auth.events.ts";

export async function register(data: {
    email: string,
    password: string,
    correlationId: string
}) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
        throw new ConflictError("Email already registered");
    }
    
    const passwordHash = await hashPassword(data.password);

    const user = await userRepository.create({
        email: data.email,
        passwordHash
    });

    const defaultRole = await prisma.role.findFirst({
        where: { isDefault: true },
    });

    if (defaultRole) {
        await prisma.userRole.create({
            data: {
                roleId: defaultRole.id,
                userId: user.id,
            }
        });
    }

    appEvents.emit(AUTH_EVENTS.USER_REGISTERED, {
        id: user.id,
        email: user.email,
        tier: user.tier,
        correlationId: data.correlationId,
    });

    return{ id: user.id, email: user.email, tier: user.tier };
}

export async function login( data: {
    email: string,
    password: string,
    correlationId: string,
    deviceInfo?: string,
}) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.isActive) {
        appEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
            email:data.email,
            deviceInfo: data.deviceInfo,
            reason: "user_not_found",
            correlationId: data.correlationId,
        });
        throw new UnauthorizedError("Invalid Credentials");
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
        appEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
            email: data.email,
            deviceInfo: data.deviceInfo,
            reason: "wrong_password",
            correlationId: data.correlationId,
        });
        throw new UnauthorizedError("Invalid Credentials");
    }

    const accessToken = generateAccessToken({ id: user.id, tier: user.tier });
    const refreshToken = generateRefreshToken({ id: user.id, tier: user.tier });

    const refreshHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

    await prisma.refreshToken.create({
        data: {
            token: refreshHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
    });

    appEvents.emit(AUTH_EVENTS.USER_LOGGED_IN, {
        userId: user.id,
        deviceInfo: data.deviceInfo,
        correlationId: data.correlationId,
    });

    return {
        accessToken,
        refreshToken,
        data: { id: user.id, email: user.email, tier: user.tier },
    };
}

export async function refresh(rawRefreshToken: string) {
    let payload;
    try {
        payload = verifyRefreshToken(rawRefreshToken);
    }
    catch {
        throw new UnauthorizedError("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
        throw new UnauthorizedError("Invalid token type");
    }

    const refreshHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

    const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshHash }},
    );

    if (!stored || stored.expiresAt < new Date()) {
        throw new UnauthorizedError("Refresh token expired or revoked");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
        throw new UnauthorizedError("Invalid refresh token");
    }
    await prisma.refreshToken.delete({ where: { token: refreshHash } });

    const accessToken = generateAccessToken({ id: user.id, tier: user.tier });
    const refreshToken = generateRefreshToken({ id: user.id, tier: user.tier });
    const newRefreshHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

    await prisma.refreshToken.create({
        data: {
            token: newRefreshHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
    });

    return {
        accessToken,
        refreshToken,
        data: { id: user.id, email: user.email, tier: user.tier },
    };
}

export async function logout(rawRefreshToken: string) {
    const refreshHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

    await prisma.refreshToken.deleteMany({
        where: { token: refreshHash }
    });
}