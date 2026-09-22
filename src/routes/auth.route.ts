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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
*                 type: string
 *                 minLength: 8
 *                 example: MyPassword123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post("/register", validate(registerSchema), registerController);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
*                 type: string
 *                 minLength: 8
 *                 example: MyPassword123
 *     responses:
 *       201:
 *         description: User logged in successfully
 *       400:
 *         description: Validation error, Invalid password
 */
router.post("/login", validate(loginSchema), loginController);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", validate(refreshSchema), refreshTokenController);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out of account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid, expired or revoked refresh token
 */
router.post("/logout", validate(refreshSchema), logoutController);

export default router;