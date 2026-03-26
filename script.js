class Product {
    constructor(id, name, price, image, category) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.image = image;
        this.category = category; 
    }
}

const products = [
    new Product(1, "Apple Airpods Pro 2", 10990, "img/airpods.jpg", "electronics"),
    new Product(2, "Apple Watch (Cherry Ultra Edition)", 69420, "img/watch.jpg", "electronics"),
    new Product(3, "Macbook ni Kent", 25990, "img/macbook.jpg", "electronics"),
    new Product(4, "Laptop Backpack", 459, "img/bag.jpg", "accessories"),
    new Product(5, "Phone Case", 149, "img/case.jpg", "accessories"),
    new Product(6, "JBL Flip 6", 5499, "img/speaker.jpg", "electronics")
];

let cart = [];