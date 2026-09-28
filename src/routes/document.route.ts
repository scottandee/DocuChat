import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { documentParamsSchema, listDocumentsSchema } from "../validators/document.validator.ts";
import { deleteDocumentController, getDocumentController, listDocumentsController } from "../controllers/document.controller.ts";

const router = Router()
router.use(authenticate)

router.get("/",
    requirePermission("documents:read"),
    validate(listDocumentsSchema),
    listDocumentsController,
);

router.get("/:documentId",
    requirePermission("documents:read"),
    validate(documentParamsSchema),
    getDocumentController,
);

// TODO
router.post("/",
    requirePermission("documents:create"),
)

router.delete("/",
    requirePermission("documents:delete", "admin:documents:delete"),
    validate(documentParamsSchema),
    deleteDocumentController,
)

export default router;