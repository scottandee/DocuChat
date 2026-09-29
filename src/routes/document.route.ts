import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createDocumentSchema, documentParamsSchema, listDocumentsSchema } from "../validators/document.validator.ts";
import {
    createDocumentCOntroller,
    deleteDocumentController,
    getDocProcessingStatusController,
    getDocumentController,
    listDocumentsController
} from "../controllers/document.controller.ts";

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

router.post("/",
    requirePermission("documents:create"),
    validate(createDocumentSchema),
    createDocumentCOntroller,
)

router.delete("/:documentId",
    requirePermission("documents:delete", "admin:documents:delete"),
    validate(documentParamsSchema),
    deleteDocumentController,
)

router.get("/:documentId/processing-status",
    requirePermission("documents:read"),
    validate(documentParamsSchema),
    getDocProcessingStatusController,
)

export default router;