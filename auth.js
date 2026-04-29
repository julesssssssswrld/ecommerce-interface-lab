/**
 * auth.js — Authentication utilities for NiggsShop
 *
 * Handles CSRF token management, session-based login/logout/register,
 * and provides an authenticated fetch wrapper for API calls.
 *
 * @author Jovan P. Atencio
 */

const API_BASE = 'http://localhost:8080';

function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

async function initCsrf() {
    try {
        await fetch(`${API_BASE}/login`, {
            credentials: 'include'
        });
    } catch (e) {
        console.warn('Could not initialize CSRF token:', e.message);
    }
}

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
        alert('Access Denied: You do not have permission to perform this action.');
        return response;
    }

    return response;
}

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

async function updateNavAuth() {
    const user = await getCurrentUser();
    const nav = document.querySelector('header nav ul');
    if (!nav) return;

    const existing = nav.querySelector('.auth-link');
    if (existing) {
        existing.remove();
    }

    const li = document.createElement('li');
    li.className = 'auth-link';

    if (user) {
        li.innerHTML = `<a href="#" onclick="logoutUser(); return false;">Logout (${user.username})</a>`;
    } else {
        li.innerHTML = `<a href="login.html">Login</a>`;
    }

    nav.appendChild(li);
}
