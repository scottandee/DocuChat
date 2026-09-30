import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.ts";
import { listConversationsController } from "../controllers/conversation.controller.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { listConversationsSchema } from "../validators/conversation.validator.ts";
import { conditionalGet } from "../middlewares/etag.middleware.ts";
import { noCache } from "../middlewares/cache-control.middleware.ts";
import { apiLimiter, chatLimiter } from "../middlewares/rate-limiter.miiddleware.ts";

const router = Router();
router.use(authenticate);
router.use(apiLimiter);

router.get("/",
    conditionalGet(),
    requirePermission("conversations:read"),
    noCache,
    validate(listConversationsSchema),
    listConversationsController
);

router.post("/:conversationId/messages",
    chatLimiter,
);

export default router;