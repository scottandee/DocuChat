import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { listDocumentsSchema } from "../validators/document.validator.ts";
import { listDocumentsController } from "../controllers/document.controller.ts";

const router = Router()
router.use(authenticate)

router.get("/",
    requirePermission("documents:read"),
    validate(listDocumentsSchema),
    listDocumentsController,
);

// TODO
router.post("/",
    requirePermission("documents:create"),
)

// TODO
router.delete("/",
    requirePermission("documents:delete", "admin:documents:delete"),
)

export default router;