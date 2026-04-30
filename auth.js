/**
 * auth.js — Authentication utilities for NiggsShop
 *
 * Handles CSRF token management, session-based login/logout/register,
 * provides an authenticated fetch wrapper, popover-based toast
 * notifications, and dynamic navbar auth state management.
 *
 * @author Jovan P. Atencio
 * @author Jules Ian C. Tomacas
 */

const API_BASE = 'http://localhost:8080';

/* ──────────────────────────────────────────────────────────
   CSRF Token Management
   ────────────────────────────────────────────────────────── */

/** Cached CSRF token fetched from the backend REST endpoint. */
let _csrfToken = null;

/**
 * Fetches the CSRF token from the backend REST endpoint.
 * This avoids cross-origin cookie issues when the frontend
 * and backend run on different ports.
 */
async function initCsrf() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/csrf`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            _csrfToken = data.token;
        }
    } catch (e) {
        console.warn('Could not initialize CSRF token:', e.message);
    }
}

/**
 * Returns the cached CSRF token.
 * @returns {string|null} the CSRF token, or null if not yet fetched
 */
function getCsrfToken() {
    return _csrfToken;
}

/* ──────────────────────────────────────────────────────────
   Authenticated Fetch Wrapper
   ────────────────────────────────────────────────────────── */

/**
 * Fetch wrapper that automatically includes credentials and
 * the CSRF token on state-changing requests. Handles 401/403
 * responses by redirecting or showing an access denied toast.
 */
async function authFetch(url, options = {}) {
    const csrfToken = getCsrfToken();
    const headers = {
        ...options.headers
    };

    if (options.method && options.method.toUpperCase() !== 'GET') {
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }
        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (response.status === 401) {
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

async function registerUser(username, password, role) {
    await initCsrf();
    const csrfToken = getCsrfToken();

    const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ username, password, role })
    });

    return response;
}

async function loginUser(username, password) {
    await initCsrf();
    const csrfToken = getCsrfToken();
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-XSRF-TOKEN': csrfToken
        },
        credentials: 'include',
        body: formData.toString(),
        redirect: 'manual'
    });

    return response;
}

async function logoutUser() {
    await initCsrf();
    const csrfToken = getCsrfToken();

    await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
            'X-XSRF-TOKEN': csrfToken
        },
        credentials: 'include'
    });

    window.location.href = 'login.html';
}

async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
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
    toast.innerHTML = '<p id="toast-message"></p><button id="toast-close" onclick="this.parentElement.hidePopover()">✕</button>';
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

    msg.textContent = message;
    toast.className = `toast-${type}`;
    toast.showPopover();

    // Auto-hide after 6 seconds
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        try { toast.hidePopover(); } catch (e) { /* already hidden */ }
    }, 6000);
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
        const payload = await response.json();
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
        showToast(fallback, 'error');
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
