import { type Request, type Response} from "express";
import { ProductService } from "../services/product.service.ts";

export class ProductController {
    private productService: ProductService;

    constructor(productService: ProductService) {
        this.productService = productService;
    }

    fetchAllProducts = async (req: Request, res: Response) => {
        const products = await this.productService.fetchAllProducts();
        res.json(products);
    };
}