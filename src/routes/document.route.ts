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
import { trackSuspiciousDocumentAccess } from "../middlewares/abuse-detection.middleware.ts";

const router = Router();
router.use(authenticate);

router.get("/",
    apiLimiter,
    requirePermission("documents:read"),
    validate(listDocumentsSchema),
    listDocumentsController,
);

router.get("/:documentId",
    apiLimiter,
    trackSuspiciousDocumentAccess,
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
    apiLimiter,
    requirePermission("documents:delete", "admin:documents:delete"),
    validate(documentParamsSchema),
    deleteDocumentController,
)

router.get("/:documentId/processing-status",
    apiLimiter,
    requirePermission("documents:read"),
    validate(documentParamsSchema),
    getDocProcessingStatusController,
)

export default router;