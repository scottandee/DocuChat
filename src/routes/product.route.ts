import { Router } from "express";
import { ProductController } from "../controllers/product.controller.ts";
import { ProductService } from "../services/product.service.ts";
import { ProductRepository } from "../repositories/product.repository.ts";

const router = Router()

const productRepository = new ProductRepository()
const productService = new ProductService(productRepository)
const productController = new ProductController(productService)

router.get("/", productController.fetchAllProducts);

export default router;