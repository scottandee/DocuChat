import { appEvents } from "../lib/events.ts";
import { logger } from "../lib/logger.ts";
import { prisma } from "../lib/prisma.ts";

export const AUTH_EVENTS = {
    USER_REGISTERED: "auth:user-registered",
    USER_LOGGED_IN: "auth:user-logged-in",
    USER_LOGGED_OUT: "auth:user-logged-out",
    TOKEN_REFRESHED: "auth:token-refreshed",
    LOGIN_FAILED: "auth:login-failed",
};

appEvents.on(AUTH_EVENTS.USER_REGISTERED, async (data) => {
    try {
        await prisma.usageLog.create({ data: {
            userId: data.id,
            action: "signup",
            tokens: 0,
            costUsd: 0,
            metadata: JSON.stringify({
                email: data.email,
                tier: data.tier,
                registeredAt: new Date().toISOString(),
            }),
        }});
    } catch(error) {
        logger.error("Failed to log user registration", {
            correlationId: data.correlationId,
            userId: data.id,
            error,
        });
    }
});

appEvents.on(AUTH_EVENTS.USER_REGISTERED, async (data) => {
    try {
        await prisma.conversation.create({ data: {
            userId: data.id,
            title: "Welcome to DocuChat",
        }});
    } catch(error) {
        logger.error("Failed to create welcome conversation", {
            correlationId: data.correlationId,
            userId: data.id,
            error,
        });
    }
});

appEvents.on(AUTH_EVENTS.USER_LOGGED_IN, async (data) => {
    try {
        await prisma.usageLog.create({ data: {
            userId: data.userId,
            action: "login",
            tokens: 0,
            costUsd: 0,
            metadata: JSON.stringify({
                deviceInfo: data.deviceInfo,
                loginAt: new Date().toISOString,
            }),
        }});
    } catch (error) {
        logger.error("Failed to log user login", {
            correlationId: data.correlationId,
            userId: data.userId,
            error,
        });
    }
});

appEvents.on(AUTH_EVENTS.LOGIN_FAILED, async (data) => {
    logger.warn("User login failed", {
        correlationId: data.correlationId,
        email: data.email,
        reason: data.reason,
        deviceInfo: data.deviceInfo,
    });
});