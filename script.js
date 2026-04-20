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

// helper function to create a product card using createElement, createTextNode, appendChild
function createProductCard(product) {
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
    
    return article;
}

// render all products on products.html
const productGrid = document.querySelector('.product-grid');

if (productGrid) {
    products.forEach(product => {
        productGrid.appendChild(createProductCard(product));
    });
}

// render featured products on landing.html (filter electronics category)
const featuredGrid = document.getElementById('featured-grid');
if (featuredGrid) {
    products.filter(p => p.category === 'electronics').forEach(product => {
        featuredGrid.appendChild(createProductCard(product));
    });
}

// render discounted products on landing.html (filter accessories under ₱500)
const discountedGrid = document.getElementById('discounted-grid');
if (discountedGrid) {
    products.filter(p => p.category === 'accessories' && p.price < 500).forEach(product => {
        discountedGrid.appendChild(createProductCard(product));
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

            // Task 6:
            const card = event.target.closest('article');
            if (card) {
                card.classList.add('fade-in');
                setTimeout(() => {
                    card.classList.remove('fade-in');
                }, 400);
            }
            
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

// Task 5
const currentUser = {
    name: "Jols",
    orderHistory: [
        {
            id: 1001,
            date: "January 15, 2026",
            items: [{ name: "Apple Airpods Pro 2", quantity: 1 }],
            total: 10990,
            status: "Delivered"
        },
        {
            id: 1002,
            date: "February 3, 2026",
            items: [{ name: "Apple Watch (Cherry Ultra Edition)", quantity: 1 }],
            total: 69420,
            status: "Shipped"
        }
    ]
};

const accountGreeting = document.getElementById('account-greeting');
if (accountGreeting) {
    accountGreeting.textContent = `Welcome, ${currentUser.name}`;
}

const ordersList = document.querySelector('#orders ul');
if (ordersList) {
    currentUser.orderHistory.forEach(order => {
        const li = document.createElement('li');

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const summaryText = document.createTextNode(`Order #${order.id} - ${order.date}`);
        summary.appendChild(summaryText);
        details.appendChild(summary);

        summary.addEventListener('click', () => {
            if (details.querySelector('dl')) return;

            const dl = document.createElement('dl');

            order.items.forEach(item => {
                const dtItem = document.createElement('dt');
                dtItem.appendChild(document.createTextNode('Item'));
                dl.appendChild(dtItem);

                const ddItem = document.createElement('dd');
                ddItem.appendChild(document.createTextNode(item.name));
                dl.appendChild(ddItem);

                const dtQty = document.createElement('dt');
                dtQty.appendChild(document.createTextNode('Quantity'));
                dl.appendChild(dtQty);

                const ddQty = document.createElement('dd');
                ddQty.appendChild(document.createTextNode(item.quantity));
                dl.appendChild(ddQty);
            });

            const dtTotal = document.createElement('dt');
            dtTotal.appendChild(document.createTextNode('Total'));
            dl.appendChild(dtTotal);

            const ddTotal = document.createElement('dd');
            ddTotal.appendChild(document.createTextNode(`₱${order.total.toLocaleString()}`));
            dl.appendChild(ddTotal);

            const dtStatus = document.createElement('dt');
            dtStatus.appendChild(document.createTextNode('Status'));
            dl.appendChild(dtStatus);

            const ddStatus = document.createElement('dd');
            ddStatus.appendChild(document.createTextNode(order.status));
            dl.appendChild(ddStatus);

            details.appendChild(dl);
        });

        li.appendChild(details);
        ordersList.appendChild(li);
    });
}
