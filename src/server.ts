import express, { type Express, type Request, type Response } from "express";
import ProductRouter from "./routes/product.route.ts";

const app: Express = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
})

app.use("/products", ProductRouter)

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});