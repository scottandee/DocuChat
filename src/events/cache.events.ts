import { cacheDel } from "../lib/cache.ts";
import { appEvents } from "../lib/events.ts";
import { ADMIN_EVENTS } from "./admin.events.ts";
import { DOC_EVENTS } from "./document.events.ts";

appEvents.on(ADMIN_EVENTS.ROLE_ASSIGNED, async (data) => {
    try {
        await cacheDel(`permissions:${data.targetUserId}`);
        console.log(`Cache busted: permissions for ${data.targetUserId}`);
    } catch(error) {
        console.error("Failed to bust permissions cache: ", error);
    }
});

appEvents.on(ADMIN_EVENTS.ROLE_REVOKED, async (data) => {
    try {
        await cacheDel(`permissions:${data.targetUserId}`);
        console.log(`Cache busted: permissions for ${data.targetUserId}`);
    } catch(error) {
        console.error("Failed to bust permissions cache: ", error);
    }
});

appEvents.on(DOC_EVENTS.DELETED, async (data) => {
    try {
        await cacheDel(`documents:${data.documentId}`);
        console.log(`Cache busted: document with ${data.documentId}`);
    } catch(error) {
        console.error("Failed to bust document cache: ", error);
    }
});