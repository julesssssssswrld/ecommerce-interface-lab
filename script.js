//  Task 1

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
    new Product(6, "JBL Flip 6", 5499, "img/speaker.jpg", "electronics"),
    new Product(7, "Mechanical Keyboard", 2150, "img/keyboard.jpg", "accessories"),
    new Product(8, "Gaming Mouse", 1200, "img/mouse.jpg", "accessories"),
    new Product(9, "Powerbank 20000mAh", 899, "img/powerbank.jpg", "gadgets"),
    new Product(10, "Ring Light", 350, "img/ringlight.jpg", "gadgets")
];

// Task 2

const productGrid = document.querySelector('.product-grid');

if (productGrid) {
    products.forEach(product => {
        const article = document.createElement('article');
        
        const img = document.createElement('img');
        img.setAttribute('src', product.image);
        img.setAttribute('alt', product.name);
        
        const h3 = document.createElement('h3');
        const titleText = document.createTextNode(product.name);
        h3.appendChild(titleText);
        
        const p = document.createElement('p');
        const priceText = document.createTextNode(`Price: ₱${product.price}`);
        p.appendChild(priceText);
        
        const btn = document.createElement('button');
        const btnText = document.createTextNode('Add to Cart');
        btn.appendChild(btnText);
        btn.setAttribute('data-id', product.id);
        
        article.appendChild(img);
        article.appendChild(h3);
        article.appendChild(p);
        article.appendChild(btn);
        
        productGrid.appendChild(article);
    });
}

// Task 3

let cart = [];

document.body.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Add to Cart') {
        const id = parseInt(event.target.getAttribute('data-id'));
        const product = products.find(p => p.id === id);
        
        if (product) {
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            alert(`Added ${product.name} to cart.`);
            
            // Re-render cart if we are on the cart page
            if (document.querySelector('.cart-list')) {
                renderCart();
            }
        }
    }
});

function renderCart() {
    const cartList = document.querySelector('.cart-list');
    if (!cartList) return;

    cartList.innerHTML = '';
    
    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        
        const img = document.createElement('img');
        img.className = 'cart_img';
        img.src = item.image;
        img.alt = item.name;
        
        const h3 = document.createElement('h3');
        h3.textContent = item.name;
        
        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = `₱${item.price.toLocaleString()}`;
        
        const label = document.createElement('label');
        label.textContent = 'Qty: ';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = item.quantity;
        input.min = 0;
        
        input.addEventListener('change', (e) => {
            const newQty = parseInt(e.target.value);
            if (newQty === 0) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity = newQty;
            }
            renderCart();
        });
        
        label.appendChild(input);
        
        li.appendChild(img);
        li.appendChild(h3);
        li.appendChild(price);
        li.appendChild(label);
        
        cartList.appendChild(li);
    });

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 150;
    const total = subtotal + shipping;
    
    const summarySection = document.querySelector('main > section:nth-of-type(1)');
    if (summarySection) {
        const paragraphs = summarySection.querySelectorAll('p');
        if (paragraphs.length >= 3) {
            paragraphs[0].textContent = `Subtotal: ₱${subtotal.toLocaleString()}`;
            paragraphs[1].textContent = `Shipping: ₱${shipping.toLocaleString()}`;
            paragraphs[2].innerHTML = `<b>Total: ₱${total.toLocaleString()}</b>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', renderCart);

// Task 4

const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        let isValid = true;
        const requiredInputs = checkoutForm.querySelectorAll('input[type="text"][required]');
        const errorMessage = document.getElementById('error-message');

        errorMessage.textContent = '';
        requiredInputs.forEach(input => input.classList.remove('error'));
        
        requiredInputs.forEach(input => {
            if (input.value.trim() === '') {
                isValid = false;
                input.classList.add('error');
            }
        });
        
        if (!isValid) {
            errorMessage.textContent = 'Please fill out all required fields.';
        } else {
            console.log('Order successfully placed!');
            window.location.href = 'thankyou.html';
        }
    });
}

