import express, { type Express, type NextFunction, type Request, type Response } from "express";
import AuthRouter from "./routes/auth.route.ts";
import { config } from "./lib/config.ts";
import { logger } from "./lib/logger.ts";
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from "./config/swagger.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";
import { NotFoundError } from "./lib/errors.ts";

const app: Express = express();

app.use(express.json());

// ======== REQUEST LOGGING ===========
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
    });
    next();
});

// ========= HEALTH CHECK ================
app.get("/health", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
    });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
});

app.use("/api/v1/auth", AuthRouter);

app.use((req, res, next) => {
    next(new NotFoundError(
        `Route ${req.method} ${req.originalUrl} not found`
    ));
});
app.use(errorHandler);

export default app;