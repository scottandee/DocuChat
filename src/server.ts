import express, { type Express, type Request, type Response } from "express";

const app: Express = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
})

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});