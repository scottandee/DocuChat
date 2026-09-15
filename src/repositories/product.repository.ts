export class ProductRepository {
    findAll() {
        return [
            {
                id: 1,
                name: "Wireless Headphones",
                price: 45000,
                category: "Electronics",
                inStock: true
            },
            {
                id: 2,
                name: "Running Shoes",
                price: 35000,
                category: "Fashion",
                inStock: true
            },
            {
                id: 3,
                name: "Leather Backpack",
                price: 28000,
                category: "Bags",
                inStock: false
            },
            {
                id: 4,
                name: "Smart Watch",
                price: 75000,
                category: "Electronics",
                inStock: true
            }
        ];
    }
}