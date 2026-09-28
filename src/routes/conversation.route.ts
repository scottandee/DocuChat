import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.ts";
import { listConversationsController } from "../controllers/conversation.controller.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { listConversationsSchema } from "../validators/conversation.validator.ts";

const router = Router();
router.use(authenticate);

router.get("/",
    requirePermission("conversations:read"),
    validate(listConversationsSchema),
    listConversationsController
);

export default router;