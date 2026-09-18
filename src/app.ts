import express, { type Express, type NextFunction, type Request, type Response } from "express";
import ProductRouter from "./routes/product.route.ts";
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

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
})

app.use("/products", ProductRouter);

export default app;