/**
 * KING ICE GOLD - Sistema de Almacenamiento (API-Connected)
 * Now uses the backend API for products, categories, orders, and admin auth.
 * Cart remains in localStorage (client-side only).
 */

const STORAGE_KEYS = {
  CART: 'kig_cart',
  SESSION: 'kig_jwt_token',
  ADMIN: 'kig_admin'
};

// ==================== UTILIDADES ====================

function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== STORAGE BASE (for cart only) ====================

const Storage = {
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

// ==================== COLECCIONES/CATEGORÍAS (API) ====================

const Collections = {
  _cache: null,

  async loadAll() {
    const result = await API.Categories.getAll();
    if (result.success && result.data.categories) {
      this._cache = result.data.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image_url || `images/categories/${cat.slug}.png`,
        order: cat.display_order || 0,
        active: cat.active
      }));
    } else {
      this._cache = this._getDefaults();
    }
    return this._cache;
  },

  getAll() {
    return this._cache || this._getDefaults();
  },

  getById(id) {
    const collections = this.getAll();
    return collections.find(c => c.id === id);
  },

  getBySlug(slug) {
    const collections = this.getAll();
    return collections.find(c => c.slug === slug);
  },

  async create(data) {
    const result = await API.Categories.create(data);
    if (result.success) {
      await this.loadAll(); // Refresh cache
      return result.data.category;
    }
    return null;
  },

  async update(id, data) {
    const result = await API.Categories.update(id, data);
    if (result.success) {
      await this.loadAll();
      return result.data.category;
    }
    return null;
  },

  async delete(id) {
    const result = await API.Categories.delete(id);
    if (result.success) {
      await this.loadAll();
      return true;
    }
    return false;
  },

  _getDefaults() {
    return [
      { name: 'Cadenas', slug: 'cadenas', order: 1, image: 'images/categories/cadenas.png' },
      { name: 'Anillos', slug: 'anillos', order: 2, image: 'images/categories/anillos.png' },
      { name: 'Aretes', slug: 'aretes', order: 3, image: 'images/categories/aretes.png' },
      { name: 'Pulsos', slug: 'pulsos', order: 4, image: 'images/categories/pulsos.png' },
      { name: 'Dijes', slug: 'dijes', order: 5, image: 'images/categories/dijes.png' },
      { name: 'Relojes', slug: 'relojes', order: 6, image: 'images/categories/relojes.png' }
    ];
  },

  initDefaults() {
    // No-op: data comes from API, defaults loaded if API fails
  }
};

// ==================== PRODUCTOS (API) ====================

const Products = {
  _cache: null,

  async loadAll() {
    const result = await API.Products.getAll({ limit: 200 });
    if (result.success && result.data.products) {
      this._cache = result.data.products.map(p => this._transform(p));
    } else {
      this._cache = [];
    }
    return this._cache;
  },

  async loadFeatured(limit = 8) {
    const result = await API.Products.getFeatured(limit);
    if (result.success && result.data.products) {
      return result.data.products.map(p => this._transform(p));
    }
    return [];
  },

  _transform(p) {
    // Transform API product to the format the frontend expects
    const images = Array.isArray(p.images)
      ? p.images.map(img => img.image_url || img)
      : [];

    const options = {};
    if (Array.isArray(p.options)) {
      p.options.forEach(opt => {
        const values = typeof opt.option_values === 'string'
          ? JSON.parse(opt.option_values)
          : opt.option_values;
        options[opt.option_name] = values;
      });
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: typeof p.category === 'object' ? p.category.slug : p.category,
      categoryName: typeof p.category === 'object' ? p.category.name : '',
      categoryId: typeof p.category === 'object' ? p.category.id : p.category_id,
      description: p.description || '',
      basePrice: parseFloat(p.base_price) || 0,
      images: images.length > 0 ? images : [`images/products/${typeof p.category === 'object' ? p.category.slug : 'default'}.png`],
      options: options,
      active: p.active !== false,
      featured: p.featured || false,
      sku: p.sku || '',
      createdAt: p.created_at
    };
  },

  getAll() {
    return this._cache || [];
  },

  getActive() {
    return this.getAll().filter(p => p.active);
  },

  getById(id) {
    return this.getAll().find(p => p.id === id || p.id === parseInt(id));
  },

  getByCategory(categorySlug) {
    return this.getActive().filter(p => p.category === categorySlug);
  },

  getFeatured(limit = 8) {
    return this.getActive().filter(p => p.featured).slice(0, limit);
  },

  async create(data) {
    const result = await API.Products.create(data);
    if (result.success) {
      await this.loadAll();
      return result.data.product;
    }
    return null;
  },

  async update(id, data) {
    const result = await API.Products.update(id, data);
    if (result.success) {
      await this.loadAll();
      return result.data.product;
    }
    return null;
  },

  async delete(id) {
    const result = await API.Products.delete(id);
    if (result.success) {
      await this.loadAll();
      return true;
    }
    return false;
  },

  initDefaults() {
    // No-op: data comes from API
  }
};

// ==================== CARRITO (localStorage — client-side) ====================

const Cart = {
  get() {
    return Storage.get(STORAGE_KEYS.CART) || [];
  },

  add(productId, options = {}, quantity = 1) {
    const cart = this.get();
    const product = Products.getById(productId);
    if (!product) return null;

    // Crear key única basada en producto + opciones
    const optionsKey = JSON.stringify(options);
    const existingIndex = cart.findIndex(item =>
      item.productId === productId && JSON.stringify(item.options) === optionsKey
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: generateId('cart-'),
        productId,
        name: product.name,
        image: product.images[0] || '',
        options,
        price: product.basePrice,
        quantity
      });
    }

    Storage.set(STORAGE_KEYS.CART, cart);
    this.updateCartCount();
    return cart;
  },

  updateQuantity(itemId, quantity) {
    const cart = this.get();
    const index = cart.findIndex(item => item.id === itemId);
    if (index === -1) return null;

    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }

    Storage.set(STORAGE_KEYS.CART, cart);
    this.updateCartCount();
    return cart;
  },

  remove(itemId) {
    const cart = this.get();
    const filtered = cart.filter(item => item.id !== itemId);
    Storage.set(STORAGE_KEYS.CART, filtered);
    this.updateCartCount();
    return filtered;
  },

  clear() {
    Storage.set(STORAGE_KEYS.CART, []);
    this.updateCartCount();
  },

  getTotal() {
    const cart = this.get();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getItemCount() {
    const cart = this.get();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  updateCartCount() {
    const count = this.getItemCount();
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// ==================== PEDIDOS (API) ====================

const Orders = {
  async create(orderData) {
    const result = await API.Orders.create(orderData);
    if (result.success) {
      return result.data.order || result.data;
    }
    console.error('Error creating order:', result.error);
    return { error: result.error || 'Error creating order' };
  },

  async getAll() {
    const result = await API.Orders.getAll();
    if (result.success) {
      return result.data.orders || [];
    }
    return [];
  },

  async getById(id) {
    const result = await API.Orders.getById(id);
    if (result.success) {
      return result.data.order || null;
    }
    return null;
  },

  async updateStatus(id, status, note = '') {
    const result = await API.Orders.updateStatus(id, status, note);
    if (result.success) {
      return result.data.order || result.data;
    }
    return null;
  },

  async getStats() {
    const result = await API.Dashboard.getStats();
    if (result.success) {
      return result.data;
    }
    return { total: 0, pending: 0, monthlyRevenue: 0, uniqueCustomers: 0 };
  }
};

// ==================== AUTENTICACIÓN ADMIN (API + JWT) ====================

const Auth = {
  async login(username, password) {
    const result = await API.Auth.login(username, password);
    if (result.success) {
      return { success: true, message: 'Login exitoso' };
    }
    return { success: false, message: result.error || 'Credenciales incorrectas' };
  },

  logout() {
    API.Auth.logout();
  },

  isLoggedIn() {
    return API.Auth.isLoggedIn();
  },

  checkAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  async changePassword(currentPassword, newPassword) {
    const result = await API.Auth.changePassword(currentPassword, newPassword);
    if (result.success) {
      return { success: true, message: 'Contraseña actualizada' };
    }
    return { success: false, message: result.error || 'Error al cambiar contraseña' };
  },

  initAdmin() {
    // No-op: admin users are in the database
  }
};

// ==================== INICIALIZACIÓN ====================

async function initStorage() {
  // Load data from API in parallel
  try {
    await Promise.all([
      Collections.loadAll(),
      Products.loadAll()
    ]);
  } catch (err) {
    console.warn('⚠️ Could not load data from API, using defaults:', err.message);
  }

  Cart.updateCartCount();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initStorage().then(() => {
      // Dispatch custom event when data is ready
      window.dispatchEvent(new Event('kig:ready'));
    });
  });
} else {
  initStorage().then(() => {
    window.dispatchEvent(new Event('kig:ready'));
  });
}

// Exportar para uso global
window.KIG = {
  Storage,
  Collections,
  Products,
  Cart,
  Orders,
  Auth,
  formatPrice,
  formatDate,
  generateId,
  ready: initStorage
};
