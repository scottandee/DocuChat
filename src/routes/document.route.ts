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
import { conditionalGet } from "../middlewares/etag.middleware.ts";
import { apiLimiter, uploadLimiter } from "../middlewares/rate-limiter.miiddleware.ts";

const router = Router();
router.use(authenticate);
router.use(apiLimiter);

router.get("/",
    requirePermission("documents:read"),
    validate(listDocumentsSchema),
    listDocumentsController,
);

router.get("/:documentId",
    conditionalGet(),
    requirePermission("documents:read"),
    validate(documentParamsSchema),
    getDocumentController,
);

router.post("/",
    uploadLimiter,
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