/**
 * KING ICE GOLD - Sistema de Almacenamiento
 * Gestión de localStorage para productos, pedidos, categorías y sesión admin
 */

const STORAGE_KEYS = {
  PRODUCTS: 'kig_products',
  COLLECTIONS: 'kig_collections',
  ORDERS: 'kig_orders',
  CART: 'kig_cart',
  ADMIN: 'kig_admin',
  SESSION: 'kig_session'
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

// ==================== STORAGE BASE ====================

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

// ==================== COLECCIONES/CATEGORÍAS ====================

const Collections = {
  getAll() {
    return Storage.get(STORAGE_KEYS.COLLECTIONS) || [];
  },

  getById(id) {
    const collections = this.getAll();
    return collections.find(c => c.id === id);
  },

  getBySlug(slug) {
    const collections = this.getAll();
    return collections.find(c => c.slug === slug);
  },

  create(data) {
    const collections = this.getAll();
    const newCollection = {
      id: generateId('col-'),
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      image: data.image || '',
      order: data.order || collections.length + 1,
      active: true,
      createdAt: new Date().toISOString()
    };
    collections.push(newCollection);
    Storage.set(STORAGE_KEYS.COLLECTIONS, collections);
    return newCollection;
  },

  update(id, data) {
    const collections = this.getAll();
    const index = collections.findIndex(c => c.id === id);
    if (index === -1) return null;

    collections[index] = { ...collections[index], ...data, updatedAt: new Date().toISOString() };
    Storage.set(STORAGE_KEYS.COLLECTIONS, collections);
    return collections[index];
  },

  delete(id) {
    const collections = this.getAll();
    const filtered = collections.filter(c => c.id !== id);
    Storage.set(STORAGE_KEYS.COLLECTIONS, filtered);
    return true;
  },

  initDefaults() {
    const existing = this.getAll();

    // Mapeo de categorías a imágenes
    const categoryImages = {
      'cadenas': 'images/categories/cadenas.png',
      'anillos': 'images/categories/anillos.png',
      'aretes': 'images/categories/aretes.png',
      'pulsos': 'images/categories/pulsos.png',
      'dijes': 'images/categories/dijes.png',
      'relojes': 'images/categories/relojes.png'
    };

    // Si ya existen categorías, actualizamos las imágenes faltantes
    if (existing.length > 0) {
      const updated = existing.map(cat => {
        if (!cat.image || cat.image === '') {
          const img = categoryImages[cat.slug];
          if (img) {
            cat.image = img;
          }
        }
        return cat;
      });
      Storage.set(STORAGE_KEYS.COLLECTIONS, updated);
      return;
    }

    const defaults = [
      { name: 'Cadenas', slug: 'cadenas', order: 1, image: 'images/categories/cadenas.png' },
      { name: 'Anillos', slug: 'anillos', order: 2, image: 'images/categories/anillos.png' },
      { name: 'Aretes', slug: 'aretes', order: 3, image: 'images/categories/aretes.png' },
      { name: 'Pulsos', slug: 'pulsos', order: 4, image: 'images/categories/pulsos.png' },
      { name: 'Dijes', slug: 'dijes', order: 5, image: 'images/categories/dijes.png' },
      { name: 'Relojes', slug: 'relojes', order: 6, image: 'images/categories/relojes.png' }
    ];

    defaults.forEach(col => this.create(col));
  }
};

// ==================== PRODUCTOS ====================

const Products = {
  getAll() {
    return Storage.get(STORAGE_KEYS.PRODUCTS) || [];
  },

  getActive() {
    return this.getAll().filter(p => p.active);
  },

  getById(id) {
    const products = this.getAll();
    return products.find(p => p.id === id);
  },

  getByCategory(categorySlug) {
    return this.getActive().filter(p => p.category === categorySlug);
  },

  getFeatured(limit = 8) {
    return this.getActive().slice(0, limit);
  },

  create(data) {
    const products = this.getAll();
    const newProduct = {
      id: generateId('prod-'),
      name: data.name,
      category: data.category,
      description: data.description || '',
      basePrice: parseFloat(data.basePrice) || 0,
      images: data.images || [],
      options: data.options || {},
      active: data.active !== false,
      featured: data.featured || false,
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    Storage.set(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },

  update(id, data) {
    const products = this.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    if (data.basePrice) {
      data.basePrice = parseFloat(data.basePrice);
    }

    products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() };
    Storage.set(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  delete(id) {
    const products = this.getAll();
    const filtered = products.filter(p => p.id !== id);
    Storage.set(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  initDefaults() {
    // Mapeo de categorías a imágenes
    const categoryImages = {
      'cadenas': 'images/products/cadena.png',
      'anillos': 'images/products/anillo.png',
      'aretes': 'images/products/aretes.png',
      'pulsos': 'images/products/pulsera.png',
      'dijes': 'images/products/dije.png',
      'relojes': 'images/products/reloj.png'
    };

    // Productos de ejemplo
    const defaults = [
      {
        name: 'Cadena de Oro Torzal Pavé',
        category: 'cadenas',
        description: 'Elegante cadena de oro amarillo estilo torzal pavé. Acabado brillante de alta calidad.',
        basePrice: 27838.20,
        images: ['images/products/cadena.png'],
        options: {
          medida: ['45cm', '50cm', '55cm', '60cm'],
          kilataje: ['10k', '14k'],
          estructura: ['3.919g', '4.339g', '4.829g', '5.32g']
        },
        featured: true
      },
      {
        name: 'Cadena Tejido Hollow Box',
        category: 'cadenas',
        description: 'Cadena de oro con tejido hollow box. Diseño moderno y versátil.',
        basePrice: 10374.00,
        images: ['images/products/cadena.png'],
        options: {
          medida: ['45cm', '50cm', '55cm', '60cm'],
          kilataje: ['10k', '14k'],
          estructura: ['3.919g', '4.339g', '4.829g', '5.32g']
        },
        featured: true
      },
      {
        name: 'Anillo Solitario Diamante',
        category: 'anillos',
        description: 'Anillo solitario con diamante central de alta calidad.',
        basePrice: 15500.00,
        images: ['images/products/anillo.png'],
        options: {
          talla: ['6', '7', '8', '9', '10'],
          kilataje: ['10k', '14k']
        },
        featured: true
      },
      {
        name: 'Aretes de Oro Huggie',
        category: 'aretes',
        description: 'Aretes estilo huggie en oro amarillo. Elegantes y cómodos.',
        basePrice: 4500.00,
        images: ['images/products/aretes.png'],
        options: {
          kilataje: ['10k', '14k']
        },
        featured: true
      },
      {
        name: 'Pulsera Cubana',
        category: 'pulsos',
        description: 'Pulsera estilo cubano en oro. Look urbano y moderno.',
        basePrice: 18900.00,
        images: ['images/products/pulsera.png'],
        options: {
          medida: ['18cm', '20cm', '22cm'],
          kilataje: ['10k', '14k'],
          estructura: ['15g', '20g', '25g']
        },
        featured: true
      },
      {
        name: 'Dije Cruz San Benito',
        category: 'dijes',
        description: 'Dije de cruz San Benito en oro. Símbolo de protección.',
        basePrice: 3200.00,
        images: ['images/products/dije.png'],
        options: {
          tamaño: ['Pequeño', 'Mediano', 'Grande'],
          kilataje: ['10k', '14k']
        },
        featured: true
      },
      {
        name: 'Reloj Oro con Diamantes',
        category: 'relojes',
        description: 'Reloj de lujo en oro amarillo con bisel de diamantes. Elegancia atemporal.',
        basePrice: 45000.00,
        images: ['images/products/reloj.png'],
        options: {
          tamaño: ['Mediano', 'Grande'],
          kilataje: ['14k']
        },
        featured: true
      },
      {
        name: 'Reloj Clásico Oro Rosa',
        category: 'relojes',
        description: 'Reloj elegante en oro rosa con detalles de diamantes. Perfecto para ocasiones especiales.',
        basePrice: 38500.00,
        images: ['images/products/reloj.png'],
        options: {
          tamaño: ['Pequeño', 'Mediano'],
          kilataje: ['14k']
        },
        featured: true
      }
    ];

    const existingProducts = this.getAll();

    // Si no hay productos, crear todos
    if (existingProducts.length === 0) {
      defaults.forEach(prod => this.create(prod));
      return;
    }

    // Actualizar imágenes faltantes en productos existentes
    let needsUpdate = false;
    const updatedProducts = existingProducts.map(product => {
      if (!product.images || product.images.length === 0 || product.images[0] === '') {
        const img = categoryImages[product.category];
        if (img) {
          product.images = [img];
          needsUpdate = true;
        }
      }
      return product;
    });

    if (needsUpdate) {
      Storage.set(STORAGE_KEYS.PRODUCTS, updatedProducts);
    }

    // Verificar si falta algún producto por categoría y agregarlo
    const existingCategories = [...new Set(existingProducts.map(p => p.category))];
    const defaultCategories = [...new Set(defaults.map(p => p.category))];
    const missingCategories = defaultCategories.filter(cat => !existingCategories.includes(cat));

    if (missingCategories.length > 0) {
      const productsToAdd = defaults.filter(p => missingCategories.includes(p.category));
      productsToAdd.forEach(prod => this.create(prod));
    }
  }
};

// ==================== CARRITO ====================

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

// ==================== PEDIDOS ====================

const Orders = {
  getAll() {
    return Storage.get(STORAGE_KEYS.ORDERS) || [];
  },

  getById(id) {
    const orders = this.getAll();
    return orders.find(o => o.id === id);
  },

  getByStatus(status) {
    return this.getAll().filter(o => o.status === status);
  },

  create(customerData, items, totals) {
    const orders = this.getAll();
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(orders.length + 1).toString().padStart(3, '0')}`;

    const newOrder = {
      id: generateId('order-'),
      orderNumber,
      customer: {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: {
          street: customerData.street,
          colony: customerData.colony,
          city: customerData.city,
          state: customerData.state,
          zip: customerData.zip,
          references: customerData.references || ''
        }
      },
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        options: item.options,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      status: 'pending',
      paymentMethod: 'oxxo',
      createdAt: new Date().toISOString(),
      statusHistory: [
        { status: 'pending', date: new Date().toISOString(), note: 'Pedido creado' }
      ]
    };

    orders.push(newOrder);
    Storage.set(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  },

  updateStatus(id, status, note = '') {
    const orders = this.getAll();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index].status = status;
    orders[index].statusHistory.push({
      status,
      date: new Date().toISOString(),
      note
    });
    orders[index].updatedAt = new Date().toISOString();

    Storage.set(STORAGE_KEYS.ORDERS, orders);
    return orders[index];
  },

  getStats() {
    const orders = this.getAll();
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = orders.filter(o => new Date(o.createdAt) >= thisMonth);

    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      monthlyRevenue: monthlyOrders.reduce((sum, o) => sum + o.total, 0),
      uniqueCustomers: [...new Set(orders.map(o => o.customer.email))].length
    };
  }
};

// ==================== AUTENTICACIÓN ADMIN ====================

const Auth = {
  // Hash simple para contraseña (en producción usar bcrypt)
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  },

  initAdmin() {
    const existing = Storage.get(STORAGE_KEYS.ADMIN);
    if (existing) return;

    // Credenciales por defecto
    Storage.set(STORAGE_KEYS.ADMIN, {
      username: 'admin',
      passwordHash: this.hashPassword('kingice2026'),
      createdAt: new Date().toISOString()
    });
  },

  login(username, password) {
    const admin = Storage.get(STORAGE_KEYS.ADMIN);
    if (!admin) return { success: false, message: 'No hay administrador configurado' };

    if (admin.username !== username) {
      return { success: false, message: 'Usuario incorrecto' };
    }

    if (admin.passwordHash !== this.hashPassword(password)) {
      return { success: false, message: 'Contraseña incorrecta' };
    }

    // Crear sesión (expira en 24 horas)
    const session = {
      token: generateId('sess-'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    Storage.set(STORAGE_KEYS.SESSION, session);

    return { success: true, message: 'Login exitoso' };
  },

  logout() {
    Storage.remove(STORAGE_KEYS.SESSION);
  },

  isLoggedIn() {
    const session = Storage.get(STORAGE_KEYS.SESSION);
    if (!session) return false;

    if (new Date(session.expiresAt) < new Date()) {
      this.logout();
      return false;
    }

    return true;
  },

  checkAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  changePassword(currentPassword, newPassword) {
    const admin = Storage.get(STORAGE_KEYS.ADMIN);
    if (!admin) return { success: false, message: 'Error de configuración' };

    if (admin.passwordHash !== this.hashPassword(currentPassword)) {
      return { success: false, message: 'Contraseña actual incorrecta' };
    }

    admin.passwordHash = this.hashPassword(newPassword);
    admin.updatedAt = new Date().toISOString();
    Storage.set(STORAGE_KEYS.ADMIN, admin);

    return { success: true, message: 'Contraseña actualizada' };
  }
};

// ==================== INICIALIZACIÓN ====================

function initStorage() {
  Collections.initDefaults();
  Products.initDefaults();
  Auth.initAdmin();
  Cart.updateCartCount();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStorage);
} else {
  initStorage();
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
  generateId
};
