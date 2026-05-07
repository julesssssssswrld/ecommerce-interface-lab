/**
 * auth.js — JWT Authentication utilities for NiggsShop
 *
 * Handles JWT token management, login/logout/register via the REST API,
 * provides an authenticated fetch wrapper with Bearer token support,
 * popover-based toast notifications, and dynamic navbar auth state.
 *
 * @author Jovan P. Atencio
 * @author Jules Ian C. Tomacas
 */

const API_BASE = `http://${window.location.hostname}:8080`;

/* ──────────────────────────────────────────────────────────
   JWT Token Management (localStorage)
   ────────────────────────────────────────────────────────── */

/**
 * Stores the JWT token in localStorage.
 * @param {string} token the JWT token string
 */
function setToken(token) {
    localStorage.setItem('jwt_token', token);
}

/**
 * Retrieves the stored JWT token.
 * @returns {string|null} the JWT token, or null if not stored
 */
function getToken() {
    return localStorage.getItem('jwt_token');
}

/**
 * Removes the JWT token from localStorage.
 */
function removeToken() {
    localStorage.removeItem('jwt_token');
}

/* ──────────────────────────────────────────────────────────
   Authenticated Fetch Wrapper (Bearer Token)
   ────────────────────────────────────────────────────────── */

/**
 * Fetch wrapper that automatically includes the JWT Bearer token
 * in the Authorization header. Handles 401/403 responses by
 * redirecting or showing an access denied toast.
 */
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        ...options.headers
    };

    // Add Bearer token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Set Content-Type for requests with a body
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid — clear and redirect to login
        removeToken();
        window.location.href = 'login.html';
        return response;
    }

    if (response.status === 403) {
        showToast('Access Denied: You do not have permission to perform this action.', 'error');
        return response;
    }

    return response;
}

/* ──────────────────────────────────────────────────────────
   Auth Actions — Register, Login, Logout, Current User
   ────────────────────────────────────────────────────────── */

/**
 * Registers a new user account via the REST API.
 *
 * @param {string} username the desired username
 * @param {string} password the desired password
 * @param {string} role     the user role (USER, SELLER, ADMIN)
 * @returns {Promise<Response>} the fetch response
 */
async function registerUser(username, password, role) {
    const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
    });

    return response;
}

/**
 * Logs in a user by sending credentials to the JWT login endpoint.
 * On success, stores the returned JWT token in localStorage.
 *
 * @param {string} username the username
 * @param {string} password the password
 * @returns {Promise<Response>} the fetch response
 */
async function loginUser(username, password) {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        // Store the JWT token from the response
        setToken(data.token);
    }

    return response;
}

/**
 * Logs out the user by clearing the stored JWT token
 * and redirecting to the login page.
 *
 * Since JWT is stateless, there's no server-side session
 * to invalidate — we just discard the token.
 */
async function logoutUser() {
    removeToken();
    window.location.href = 'login.html';
}

/**
 * Fetches the currently authenticated user's info from the API.
 * Uses the stored JWT token for authentication.
 *
 * @returns {Promise<Object|null>} the user object, or null if not authenticated
 */
async function getCurrentUser() {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        }
        // Token might be expired
        if (response.status === 401) {
            removeToken();
        }
        return null;
    } catch (e) {
        return null;
    }
}

/* ──────────────────────────────────────────────────────────
   Navbar Auth State Management
   ────────────────────────────────────────────────────────── */

/**
 * Updates the navbar to reflect the current auth state.
 *
 * When logged in:  Home, Products, Cart, My Account, Logout(username)
 * When logged out: Home, Products, Sign Up, Login
 */
async function updateNavAuth() {
    const user = await getCurrentUser();
    const body = document.body;

    // Toggle CSS classes for visibility rules
    if (user) {
        body.classList.add('authenticated');
        body.classList.remove('guest');
    } else {
        body.classList.add('guest');
        body.classList.remove('authenticated');
    }

    // Populate the logout link if logged in
    const logoutLink = document.getElementById('nav-logout-link');
    if (logoutLink && user) {
        logoutLink.textContent = `Logout (${user.username})`;
    }
}

/* ──────────────────────────────────────────────────────────
   Popover Toast Notification System
   ────────────────────────────────────────────────────────── */

/**
 * Ensures the toast popover element exists in the DOM.
 * Creates it on-demand if not already present.
 */
function ensureToastElement() {
    if (document.getElementById('toast-popover')) return;

    const toast = document.createElement('div');
    toast.id = 'toast-popover';
    toast.setAttribute('popover', 'manual');
    toast.innerHTML = '<p id="toast-message"></p>';
    document.body.appendChild(toast);
}

/**
 * Shows a toast notification using the HTML Popover API.
 *
 * @param {string} message  the message to display
 * @param {string} type     'error', 'success', or 'info'
 */
function showToast(message, type = 'error') {
    ensureToastElement();
    const toast = document.getElementById('toast-popover');
    const msg = document.getElementById('toast-message');

    // Hide any currently-showing toast first
    try { toast.hidePopover(); } catch (e) { /* not open */ }

    msg.textContent = message;
    toast.className = `toast-${type}`;
    toast.showPopover();

    // Auto-hide after 3 seconds
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        try { toast.hidePopover(); } catch (e) { /* already hidden */ }
    }, 3000);
}

/**
 * Parses a backend error response and shows it as a toast.
 * Handles both single `message` fields and validation `errors` arrays.
 *
 * @param {Response} response the fetch Response object
 * @param {string}   fallback default message if parsing fails
 */
async function showResponseError(response, fallback = 'An error occurred. Please try again.') {
    try {
        const text = await response.text();
        if (!text || text.trim() === '') {
            // Empty body — show HTTP status info
            const statusMsg = `${response.status} ${response.statusText || 'Error'}`;
            showToast(`${fallback} (${statusMsg})`, 'error');
            return;
        }
        const payload = JSON.parse(text);
        if (payload.errors && Array.isArray(payload.errors)) {
            // Validation errors — show each one
            showToast(payload.errors.join('\n'), 'error');
        } else if (payload.message) {
            showToast(payload.message, 'error');
        } else if (payload.error) {
            showToast(payload.error, 'error');
        } else {
            showToast(fallback, 'error');
        }
    } catch (e) {
        // Response body wasn't valid JSON
        const statusMsg = `${response.status} ${response.statusText || 'Error'}`;
        showToast(`${fallback} (${statusMsg})`, 'error');
    }
}

/* ──────────────────────────────────────────────────────────
   Auth Guard — Redirect unauthenticated users
   ────────────────────────────────────────────────────────── */

/**
 * Checks if the user is authenticated. If not, redirects to login.
 * Call this on protected pages (cart, checkout, account).
 *
 * @returns {Promise<Object|null>} the current user, or null (after redirect)
 */
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}
