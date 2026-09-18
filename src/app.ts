import express, { type Express, type Request, type Response } from "express";
import ProductRouter from "./routes/product.route.ts";

const app: Express = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
})

app.use("/products", ProductRouter)

export default app;