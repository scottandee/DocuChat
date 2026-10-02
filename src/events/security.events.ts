import { cacheRedis } from "../lib/cache.ts";
import { appEvents } from "../lib/events.ts";
import { logger } from "../lib/logger.ts";
import { AUTH_EVENTS } from "./auth.events.ts";

appEvents.on(AUTH_EVENTS.LOGIN_FAILED, async (data) => {
    try {
        const key = `login-failure:${data.deviceInfo}`;
        const failures = await cacheRedis.incr(key);

        if (failures === 1) {
            await cacheRedis.expire(key, 900);
        }

        if (failures >= 5) {
            logger.warn("Repeated login failures detected", {
                correlationId: data.correlationId,
                email: data.email,
                deviceInfo: data.deviceInfo,
                failures,
                windowSeconds: 900,
                event: AUTH_EVENTS.LOGIN_FAILED,
            });
        }
    } catch (error) {
        logger.error("Failed to track login failure", {
            correlationId: data.correlationId,
            email: data.email,
            error,
        });
    }
});