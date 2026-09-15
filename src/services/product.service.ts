import { ProductRepository } from "../repositories/product.repository.ts"

export class ProductService {
    private productRepository: ProductRepository;

    constructor (productRepository: ProductRepository) {
        this.productRepository = productRepository;
    }
    
    fetchAllProducts() {
        return this.productRepository.findAll();
    }
}