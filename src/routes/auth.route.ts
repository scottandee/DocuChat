import { Router } from "express";
import {
    loginController,
    logoutController,
    refreshTokenController,
    registerController
} from "../controllers/auth.controller.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { loginSchema, refreshSchema, registerSchema } from "../validators/auth.validator.ts";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", validate(refreshSchema), refreshTokenController);
router.post("/logout", validate(refreshSchema), logoutController);

export default router;