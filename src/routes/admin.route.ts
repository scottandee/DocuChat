import { Router } from "express";
import { authenticate, requirePermission } from "../middlewares/auth.middleware.ts";
import { assignRoleController, fetchRolesController, revokeRoleController } from "../controllers/admin.controller.ts";

const router = Router();
router.use(authenticate);
router.use(requirePermission("roles:manage"));

router.get("/roles", fetchRolesController);
router.post("/users/:userId/roles", assignRoleController);
router.delete("/users/:userId/roles/:roleName", revokeRoleController);

export default router;