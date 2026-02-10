/**
 * KING ICE GOLD - API Client
 * Centralized HTTP client for backend API calls
 * All requests go to /api/* (same origin — Express serves both static files and API)
 */

const API = {
    _baseUrl: '/api',
    _token: null,

    // ==================== HTTP HELPERS ====================

    _getHeaders(auth = false) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async _request(method, path, body = null, auth = false) {
        const options = {
            method,
            headers: this._getHeaders(auth)
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const res = await fetch(`${this._baseUrl}${path}`, options);
            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || `Error ${res.status}`, status: res.status };
            }
            return { success: true, data, status: res.status };
        } catch (err) {
            console.error(`API Error [${method} ${path}]:`, err);
            return { success: false, error: 'Error de conexión con el servidor', status: 0 };
        }
    },

    // ==================== TOKEN MANAGEMENT ====================

    getToken() {
        if (this._token) return this._token;
        this._token = localStorage.getItem('kig_jwt_token');
        return this._token;
    },

    setToken(token) {
        this._token = token;
        localStorage.setItem('kig_jwt_token', token);
    },

    removeToken() {
        this._token = null;
        localStorage.removeItem('kig_jwt_token');
        localStorage.removeItem('kig_admin');
    },

    // ==================== PRODUCTS ====================

    Products: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            const path = query ? `/products?${query}` : '/products';
            return API._request('GET', path);
        },

        async getFeatured(limit = 8) {
            return API._request('GET', `/products/featured?limit=${limit}`);
        },

        async getById(id) {
            return API._request('GET', `/products/${id}`);
        },

        async create(productData) {
            return API._request('POST', '/products', productData, true);
        },

        async update(id, productData) {
            return API._request('PUT', `/products/${id}`, productData, true);
        },

        async delete(id) {
            return API._request('DELETE', `/products/${id}`, null, true);
        }
    },

    // ==================== CATEGORIES ====================

    Categories: {
        async getAll() {
            return API._request('GET', '/categories');
        },

        async getBySlug(slug) {
            return API._request('GET', `/categories/${slug}`);
        },

        async create(data) {
            return API._request('POST', '/categories', data, true);
        },

        async update(id, data) {
            return API._request('PUT', `/categories/${id}`, data, true);
        },

        async delete(id) {
            return API._request('DELETE', `/categories/${id}`, null, true);
        }
    },

    // ==================== ORDERS ====================

    Orders: {
        async create(orderData) {
            return API._request('POST', '/orders', orderData);
        },

        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            const path = query ? `/orders?${query}` : '/orders';
            return API._request('GET', path, null, true);
        },

        async getById(id) {
            return API._request('GET', `/orders/${id}`, null, true);
        },

        async updateStatus(id, status, note = '') {
            return API._request('PATCH', `/orders/${id}/status`, { status, note }, true);
        }
    },

    // ==================== ADMIN AUTH ====================

    Auth: {
        async login(username, password) {
            const result = await API._request('POST', '/admin/login', { username, password });
            if (result.success && result.data.token) {
                API.setToken(result.data.token);
                localStorage.setItem('kig_admin', JSON.stringify(result.data.admin));
            }
            return result;
        },

        async logout() {
            await API._request('POST', '/admin/logout', null, true);
            API.removeToken();
        },

        isLoggedIn() {
            const token = API.getToken();
            if (!token) return false;
            // Check if JWT is expired (basic client-side check)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.exp * 1000 > Date.now();
            } catch {
                return false;
            }
        },

        getAdmin() {
            try {
                return JSON.parse(localStorage.getItem('kig_admin'));
            } catch {
                return null;
            }
        },

        async changePassword(currentPassword, newPassword) {
            return API._request('PUT', '/admin/password', { currentPassword, newPassword }, true);
        }
    },

    // ==================== DASHBOARD ====================

    Dashboard: {
        async getStats() {
            return API._request('GET', '/dashboard/stats', null, true);
        },

        async getRecentOrders(limit = 5) {
            return API._request('GET', `/dashboard/recent?limit=${limit}`, null, true);
        }
    },

    // ==================== HEALTH ====================

    async health() {
        return API._request('GET', '/health');
    }
};

// Expose globally
window.API = API;
