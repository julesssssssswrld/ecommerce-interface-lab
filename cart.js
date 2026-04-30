/**
 * cart.js — Shopping Cart API Client for NiggsShop
 *
 * Provides functions to interact with the server-side cart
 * stored in the database via the Cart REST API. All cart
 * state is persisted per-user session.
 *
 * @author Jules Ian C. Tomacas
 */

const CART_API = `${API_BASE}/api/v1/cart`;

/**
 * Fetches the current user's cart from the backend.
 * @returns {Promise<Object>} the cart object with items array
 */
async function fetchCart() {
    const response = await authFetch(CART_API);
    if (response.ok) return response.json();
    return { items: [] };
}

/**
 * Adds a product to the cart via the API.
 * @param {number} productId the product ID
 * @param {number} quantity  how many to add (default 1)
 */
async function addToCart(productId, quantity = 1) {
    await initCsrf();
    const response = await authFetch(`${CART_API}/items`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
    });

    if (response.ok || response.status === 201) {
        showToast('Added to cart!', 'success');
    } else {
        await showResponseError(response, 'Failed to add item to cart.');
    }
}

/**
 * Updates the quantity of a cart item.
 * @param {number} itemId   the cart item ID
 * @param {number} quantity the new quantity
 */
async function updateCartItem(itemId, quantity) {
    await initCsrf();
    await authFetch(`${CART_API}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
    });
}

/**
 * Removes an item from the cart.
 * @param {number} itemId the cart item ID to remove
 */
async function removeCartItem(itemId) {
    await initCsrf();
    const response = await authFetch(`${CART_API}/items/${itemId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        showToast('Item removed from cart.', 'info');
    }
}

/**
 * Clears the entire cart (used after placing an order).
 */
async function clearCart() {
    await initCsrf();
    await authFetch(CART_API, { method: 'DELETE' });
}

/**
 * Calculates the total price of all cart items.
 * @param {Array} items the cart items array
 * @returns {number} the total
 */
function cartTotal(items) {
    return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
}

/**
 * Renders the cart page dynamically from the API data.
 * Replaces all hardcoded cart HTML with live data.
 */
async function renderCartPage() {
    const cartList = document.getElementById('cart-items');
    const summarySection = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('empty-cart-msg');
    if (!cartList) return;

    const cart = await fetchCart();
    const items = cart.items || [];

    cartList.innerHTML = '';

    if (items.length === 0) {
        summarySection.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';
    summarySection.style.display = 'block';

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <img class="cart_img" src="${item.product.imageUrl || ''}" alt="${item.product.name}">
            <div class="cart-item-info">
                <h3>${item.product.name}</h3>
                <p class="price">${Number(item.product.price).toLocaleString('en-PH')}</p>
            </div>
            <div class="cart-item-actions">
                <label>Qty:
                    <input type="number" value="${item.quantity}" min="1" data-item-id="${item.id}" class="cart-qty-input">
                </label>
                <button class="btn-remove" data-item-id="${item.id}">Remove</button>
            </div>
        `;
        cartList.appendChild(li);
    });

    // Quantity change handlers
    cartList.querySelectorAll('.cart-qty-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const itemId = e.target.dataset.itemId;
            const newQty = parseInt(e.target.value);
            if (newQty > 0) {
                await updateCartItem(itemId, newQty);
                await renderCartPage();
            }
        });
    });

    // Remove button handlers
    cartList.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = e.target.dataset.itemId;
            await removeCartItem(itemId);
            await renderCartPage();
        });
    });

    // Update totals
    const total = cartTotal(items);
    const shipping = 150;
    document.getElementById('cart-subtotal').textContent = `₱${total.toLocaleString('en-PH')}`;
    document.getElementById('cart-total').textContent = `₱${(total + shipping).toLocaleString('en-PH')}`;
}
