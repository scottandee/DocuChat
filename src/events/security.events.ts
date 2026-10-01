import { cacheRedis } from "../lib/cache.ts";
import { appEvents } from "../lib/events.ts";
import { AUTH_EVENTS } from "./auth.events.ts";

appEvents.on(AUTH_EVENTS.LOGIN_FAILED, async (data) => {
    try {
        const key = `login-failure:${data.deviceInfo}`;
        const failures = await cacheRedis.incr(key);

        if (failures === 1) {
            await cacheRedis.expire(key, 900);
        }

        if (failures >= 5) {
            console.warn(
                `Security: ${failures} failed login attempts from ${data.deviceInfo} on ${data.email}`
            );
        }
    } catch (error) {
        console.error("Failed to track login failure: ", error);
    }
});