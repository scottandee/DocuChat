import express, { type Express, type NextFunction, type Request, type Response } from "express";
import AuthRouter from "./routes/auth.routes.ts";
import { config } from "./lib/config.ts";
import { logger } from "./lib/logger.ts";

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

app.use("/api/auth", AuthRouter);

export default app;