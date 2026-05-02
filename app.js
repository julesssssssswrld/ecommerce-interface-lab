/**
 * app.js — Fetch API Integration for NiggsShop
 *
 * This script dynamically loads product data from the Spring Boot
 * backend API using the Fetch API with async/await syntax. It replaces
 * the static hardcoded product cards with live data from the database.
 *
 * @author Jules Ian C. Tomacas
 * @author Jovan P. Atencio
 */

/** Base URL for the backend API. Change the port if your backend runs elsewhere. */
const API_BASE_URL = `http://${window.location.hostname}:8080/api/v1`;

/**
 * Fetches all products from the backend API.
 *
 * Uses async/await for cleaner asynchronous code. The try/catch block
 * handles both network errors (no internet, server down) and HTTP errors
 * (4xx, 5xx status codes). The Fetch API does NOT reject the Promise for
 * HTTP errors — only for network failures — so we must manually check
 * response.ok to detect server-side errors.
 *
 * @returns {Promise<Array>} a promise that resolves to an array of product objects
 * @throws {Error} if the network request fails or the server returns a non-2xx status
 */
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            credentials: 'include'
        });

        // Check if the response status is in the 200-299 range.
        // Fetch only rejects on network errors, NOT on HTTP errors like 404 or 500.
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the JSON response body into a JavaScript array
        const products = await response.json();
        console.log(`Successfully fetched ${products.length} products from the API.`);
        return products;

    } catch (error) {
        // This catch block handles:
        // 1. Network errors (server unreachable, no internet)
        // 2. Errors thrown manually above (non-2xx HTTP status)
        // 3. JSON parsing errors (malformed response)
        console.error('Failed to fetch products:', error.message);
        throw error;
    }
}

/**
 * Renders an array of product objects as HTML cards inside the product grid.
 *
 * Clears any existing content in the grid container and dynamically creates
 * an <article> element for each product. If the product array is empty,
 * displays a friendly "empty state" message instead.
 *
 * @param {Array} products - the array of product objects from the API
 */
function renderProducts(products) {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    // Clear the existing static content
    grid.innerHTML = '';

    // Handle the "Empty State" if the API returns an empty list
    if (products.length === 0) {
        grid.innerHTML = '<p class="empty-state">No products available at the moment.</p>';
        return;
    }

    // Dynamically inject HTML for each product
    products.forEach((product, index) => {
        const article = document.createElement('article');

        // Add staggered animation delay for each card
        article.style.animationDelay = `${index * 0.1}s`;

        article.innerHTML = `
            <img src="${product.imageUrl || ''}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description || ''}</p>
            <p class="price">${Number(product.price).toLocaleString('en-PH')}</p>
            <p><small>Stock: ${product.stockQuantity} | Category: ${product.category}</small></p>
            <div class="product-actions">
                <a href="detail.html?id=${product.id}" class="btn">View Details</a>
            </div>
        `;

        // Add to Cart button with proper event binding
        const addBtn = document.createElement('button');
        addBtn.className = 'btn add-to-cart-btn';
        addBtn.textContent = 'Add to Cart';
        addBtn.addEventListener('click', () => addToCart(product.id));
        article.querySelector('.product-actions').appendChild(addBtn);

        // Wishlist button
        const wishBtn = document.createElement('button');
        wishBtn.className = 'btn btn-wishlist';
        wishBtn.textContent = '♡';
        wishBtn.title = 'Add to Wishlist';
        wishBtn.addEventListener('click', async () => {
            await initCsrf();
            const response = await authFetch(`${API_BASE}/api/v1/wishlist/items`, {
                method: 'POST',
                body: JSON.stringify({ productId: product.id })
            });
            if (response.ok || response.status === 201) {
                wishBtn.textContent = '♥';
                showToast(`${product.name} added to wishlist!`, 'success');
            } else {
                await showResponseError(response, 'Could not add to wishlist.');
            }
        });
        article.querySelector('.product-actions').appendChild(wishBtn);

        grid.appendChild(article);
    });
}

/**
 * Initializes the product page by fetching data from the API and
 * rendering it into the DOM. Called automatically when the page loads.
 *
 * If the fetch fails (e.g., backend is not running), an error message
 * is displayed in the product grid area to inform the user.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Only run on pages that have a product grid
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    try {
        const products = await fetchProducts();
        renderProducts(products);
    } catch (error) {
        // Display a user-friendly error message if the API is unreachable
        const grid = document.querySelector('.product-grid');
        if (grid) {
            grid.innerHTML = `
                <p class="empty-state">
                    ⚠️ Failed to load products. Please make sure the backend server is running at
                    <strong>${API_BASE_URL}</strong>
                </p>
            `;
        }
    }
});
