import express, { type Express } from "express";
import AuthRouter from "./routes/auth.route.ts";
import AdminRouter from "./routes/admin.route.ts";
import DocumentRouter from "./routes/document.route.ts";
import ConversationRouter from "./routes/conversation.route.ts";
import HealthRouter from "./routes/health.route.ts";
import { config } from "./lib/config.ts";
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from "./config/swagger.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";
import { NotFoundError } from "./lib/errors.ts";
import "./events/admin.events.ts";
import "./events/auth.events.ts";
import "./events/cache.events.ts";
import "./events/document.events.ts";
import "./events/security.events.ts";
import "./queues/document.worker.ts";
import { bullBoardAdapter } from "./config/bull-board.ts";
import { authLimiter } from "./middlewares/rate-limiter.miiddleware.ts";
import { attachFingerprint } from "./middlewares/fingerprint.middleware.ts";
import { sanitizeInput } from "./middlewares/sanitize-input.middleware.ts";
import helmet from "helmet";
import cors from "cors";
import { requestLogger } from "./middlewares/request-logger.middleware.ts";

const app: Express = express();

app.use(express.json());
app.use(helmet());

const allowedOrigins = [
    config.FRONTEND_URL || "http://localhost:3001",
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if(allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
}));

app.use(sanitizeInput);
app.use(requestLogger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
});

app.use("/health", HealthRouter);
app.use("/api/v1/auth", attachFingerprint, authLimiter, AuthRouter);
app.use("/api/v1/admin", AdminRouter);
app.use("/api/v1/documents", DocumentRouter);
app.use("/api/v1/conversations", ConversationRouter);

app.use("/admin/queues", bullBoardAdapter.getRouter());

app.use((req, res, next) => {
    next(new NotFoundError(
        `Route ${req.method} ${req.originalUrl} not found`
    ));
});
app.use(errorHandler);

export default app;