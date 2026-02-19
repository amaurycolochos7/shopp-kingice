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
      { id: 1, name: 'Cadenas', slug: 'cadenas', order: 1, image: 'images/categories/cadenas.webp' },
      { id: 2, name: 'Anillos', slug: 'anillos', order: 2, image: 'images/categories/anillos.webp' },
      { id: 3, name: 'Aretes', slug: 'aretes', order: 3, image: 'images/categories/aretes.webp' },
      { id: 4, name: 'Pulsos', slug: 'pulsos', order: 4, image: 'images/categories/pulsos.jpg' },
      { id: 5, name: 'Dijes', slug: 'dijes', order: 5, image: 'images/categories/dijes.webp' },
      { id: 6, name: 'Relojes', slug: 'relojes', order: 6, image: 'images/categories/relojes.jpg' },
      { id: 7, name: 'Diamantes', slug: 'diamantes', order: 7, image: 'images/categories/diamantes.jpg' },
      { id: 8, name: 'Religiosos', slug: 'religiosos', order: 8, image: 'images/categories/religiosos.png' }
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
    if (result.success && result.data.products && result.data.products.length > 0) {
      this._cache = result.data.products.map(p => this._transform(p));
    } else {
      this._cache = this._getDefaultProducts();
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
    return this._cache || this._getDefaultProducts();
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

  _getDefaultProducts() {
    return [
      // Cadenas
      { id: 1, name: 'Cadena de Oro 14k Full Ice con Púas y Diamantes Baguette', slug: 'cadena-oro-14k-full-ice', category: 'cadenas', categoryName: 'Cadenas', categoryId: 1, description: 'Impresionante cadena de oro de 14 quilates con diseño full ice, púas decorativas y diamantes baguette incrustados. Una pieza maestra de joyería que combina la agresividad del diseño con la elegancia del oro.', basePrice: 45000, images: ['images/products/cadenas/cadena-1.jpg'], options: { 'Largo': ['18"', '20"', '22"', '24"'], 'Kilates': ['10k', '14k', '18k'] }, active: true, featured: true, sku: 'CAD-001' },
      { id: 2, name: 'Cadena Cubana de Oro Rosa con Pavé Alternado de Circonias', slug: 'cadena-cubana-oro-rosa', category: 'cadenas', categoryName: 'Cadenas', categoryId: 1, description: 'Elegante cadena cubana en oro rosa con pavé alternado de circonias brillantes. El contraste entre el oro rosa y las piedras crea un efecto visual espectacular.', basePrice: 38000, images: ['images/products/cadenas/cadena-2.jpg', 'images/products/cadenas/cadena-3.jpg'], options: { 'Largo': ['18"', '20"', '22"'], 'Kilates': ['10k', '14k'] }, active: true, featured: true, sku: 'CAD-002' },
      { id: 3, name: 'Cadena de Oro Tejido Torzal Clásica', slug: 'cadena-torzal-clasica', category: 'cadenas', categoryName: 'Cadenas', categoryId: 1, description: 'Cadena clásica con tejido torzal en oro amarillo. Un diseño atemporal que nunca pasa de moda, perfecto para uso diario o para ocasiones especiales.', basePrice: 15000, images: ['images/products/cadenas/cadena-8.jpg'], options: { 'Largo': ['18"', '20"', '22"', '24"'], 'Kilates': ['10k', '14k'] }, active: true, featured: false, sku: 'CAD-003' },
      // Anillos
      { id: 4, name: 'Anillo de Oro con Diamantes Pavé', slug: 'anillo-oro-diamante-pave', category: 'anillos', categoryName: 'Anillos', categoryId: 2, description: 'Elegante anillo de oro con diamantes en pavé que rodean toda la banda. Un diseño sofisticado que refleja la luz desde todos los ángulos.', basePrice: 28000, images: ['images/products/anillos/anillo-2.jpg'], options: { 'Talla': ['6', '7', '8', '9', '10', '11'], 'Kilates': ['10k', '14k', '18k'] }, active: true, featured: true, sku: 'ANI-001' },
      { id: 5, name: 'Anillo Solitario de Oro con Diamante Central', slug: 'anillo-solitario-diamante', category: 'anillos', categoryName: 'Anillos', categoryId: 2, description: 'Clásico anillo solitario con un impresionante diamante central montado en oro. La montura permite una máxima reflexión de la luz.', basePrice: 35000, images: ['images/products/anillos/anillo-3.jpg'], options: { 'Talla': ['6', '7', '8', '9', '10'], 'Kilates': ['14k', '18k'] }, active: true, featured: true, sku: 'ANI-002' },
      { id: 6, name: 'Anillo de Oro con Diseño Cubano', slug: 'anillo-cubano-oro', category: 'anillos', categoryName: 'Anillos', categoryId: 2, description: 'Anillo con diseño cubano en oro macizo. Un diseño audaz y contemporáneo que hace una declaración de estilo.', basePrice: 22000, images: ['images/products/anillos/anillo-4.jpg'], options: { 'Talla': ['7', '8', '9', '10', '11', '12'], 'Kilates': ['10k', '14k'] }, active: true, featured: false, sku: 'ANI-003' },
      // Aretes
      { id: 7, name: 'Aretes Magic Alhambra Oro Blanco con Diamantes', slug: 'aretes-magic-alhambra-oro-blanco', category: 'aretes', categoryName: 'Aretes', categoryId: 3, description: 'Inspirados en el diseño icónico Alhambra, estos aretes de oro blanco están adornados con diamantes de primera calidad.', basePrice: 42000, images: ['images/products/aretes/aretes-1.png'], options: { 'Material': ['Oro Blanco 14k', 'Oro Blanco 18k'] }, active: true, featured: true, sku: 'ARE-001' },
      { id: 8, name: 'Aretes Magic Alhambra Oro Rosa con Diamantes y Madreperla', slug: 'aretes-alhambra-oro-rosa', category: 'aretes', categoryName: 'Aretes', categoryId: 3, description: 'Aretes de diseño asimétrico con motivos florales en oro rosa, combinando diamantes y madreperla negra para un contraste elegante.', basePrice: 48000, images: ['images/products/aretes/aretes-2.png'], options: { 'Material': ['Oro Rosa 14k', 'Oro Rosa 18k'] }, active: true, featured: true, sku: 'ARE-002' },
      { id: 9, name: 'Aretes Vintage Alhambra Oro Amarillo con Diamantes', slug: 'aretes-vintage-alhambra', category: 'aretes', categoryName: 'Aretes', categoryId: 3, description: 'Clásicos aretes con el diseño Vintage Alhambra en oro amarillo, adornados con diamantes de alta calidad. Perfectos para cualquier ocasión.', basePrice: 38000, images: ['images/products/aretes/aretes-3.png'], options: { 'Material': ['Oro Amarillo 14k', 'Oro Amarillo 18k'] }, active: true, featured: false, sku: 'ARE-003' },
      // Pulsos
      { id: 10, name: 'Pulso de Oro Tejido Franco con Diamantes', slug: 'pulso-oro-franco-diamantes', category: 'pulsos', categoryName: 'Pulsos', categoryId: 4, description: 'Impresionante pulso con tejido franco en oro macizo, decorado con diamantes incrustados. Una pieza robusta y elegante a la vez.', basePrice: 32000, images: ['images/products/pulsos/pulso-1.jpg'], options: { 'Largo': ['7"', '7.5"', '8"', '8.5"'], 'Kilates': ['10k', '14k'] }, active: true, featured: true, sku: 'PUL-001' },
      { id: 11, name: 'Pulso de Oro Cubano con Pavé', slug: 'pulso-cubano-pave', category: 'pulsos', categoryName: 'Pulsos', categoryId: 4, description: 'Pulso cubano clásico en oro con pavé de diamantes que recubre cada eslabón. El brillo es incomparable.', basePrice: 45000, images: ['images/products/pulsos/pulso-2.jpg'], options: { 'Largo': ['7"', '8"', '8.5"'], 'Kilates': ['14k', '18k'] }, active: true, featured: true, sku: 'PUL-002' },
      { id: 12, name: 'Pulso de Oro Tejido Monaco Shade Pavé', slug: 'pulso-monaco-shade', category: 'pulsos', categoryName: 'Pulsos', categoryId: 4, description: 'Elegante pulso con tejido Monaco y acabado en pavé sombreado. Un diseño moderno que combina tradición y vanguardia.', basePrice: 28000, images: ['images/products/pulsos/pulso-6.jpg'], options: { 'Largo': ['7"', '7.5"', '8"'], 'Kilates': ['10k', '14k'] }, active: true, featured: false, sku: 'PUL-003' },
      // Dijes
      { id: 13, name: 'Dije Ojo de Tigre en Oro con Diamantes', slug: 'dije-ojo-tigre-oro', category: 'dijes', categoryName: 'Dijes', categoryId: 5, description: 'Hermoso dije tallado con piedra ojo de tigre natural, engarzado en oro y rodeado de diamantes. Una pieza única con energía protectora.', basePrice: 18000, images: ['images/products/dijes/dije-1.png'], options: { 'Kilates': ['10k', '14k'], 'Cadena': ['Sin cadena', 'Cadena 18"', 'Cadena 20"'] }, active: true, featured: true, sku: 'DIJ-001' },
      { id: 14, name: 'Dije Estrella Diamantes en Oro Blanco', slug: 'dije-estrella-diamantes', category: 'dijes', categoryName: 'Dijes', categoryId: 5, description: 'Dije con forma de estrella en oro blanco, completamente cubierto de micro-diamantes. Brilla con intensidad bajo cualquier luz.', basePrice: 25000, images: ['images/products/dijes/dije-2.png'], options: { 'Kilates': ['14k', '18k'], 'Cadena': ['Sin cadena', 'Cadena 18"', 'Cadena 22"'] }, active: true, featured: false, sku: 'DIJ-002' },
      { id: 15, name: 'Dije Celestial de Oro con Piedras Preciosas', slug: 'dije-celestial-oro', category: 'dijes', categoryName: 'Dijes', categoryId: 5, description: 'Un dije inspirado en el cielo nocturno, elaborado en oro con una combinación de piedras preciosas que simulan las constelaciones.', basePrice: 22000, images: ['images/products/dijes/dije-3.png'], options: { 'Kilates': ['10k', '14k'], 'Cadena': ['Sin cadena', 'Cadena 20"'] }, active: true, featured: false, sku: 'DIJ-003' },
      // Relojes
      { id: 16, name: 'Reloj de Oro con Bisel de Diamantes', slug: 'reloj-oro-bisel-diamantes', category: 'relojes', categoryName: 'Relojes', categoryId: 6, description: 'Reloj de lujo en oro macizo con bisel completamente cubierto de diamantes. Un reloj que no solo dice la hora, sino que define tu estatus.', basePrice: 85000, images: ['images/products/relojes/reloj-1.jpg'], options: { 'Talla': ['38mm', '40mm', '42mm'] }, active: true, featured: true, sku: 'REL-001' },
      { id: 17, name: 'Reloj Oro Rosa Full Iced', slug: 'reloj-oro-rosa-iced', category: 'relojes', categoryName: 'Relojes', categoryId: 6, description: 'Espectacular reloj en oro rosa con diamantes cubriendo cada superficie. Una obra de arte de la relojería de lujo.', basePrice: 120000, images: ['images/products/relojes/reloj-2.jpg'], options: { 'Talla': ['40mm', '42mm'] }, active: true, featured: true, sku: 'REL-002' },
      { id: 18, name: 'Reloj Clásico de Oro con Caratula Diamantada', slug: 'reloj-clasico-diamantado', category: 'relojes', categoryName: 'Relojes', categoryId: 6, description: 'Reloj clásico con caja de oro y carátula adornada con diamantes. Combina el estilo clásico con un toque contemporáneo.', basePrice: 65000, images: ['images/products/relojes/reloj-3.jpg'], options: { 'Talla': ['36mm', '38mm', '40mm'] }, active: true, featured: false, sku: 'REL-003' },
      // Diamantes
      { id: 19, name: 'Diamante Natural Corte Brillante 1.5ct', slug: 'diamante-brillante-1-5ct', category: 'diamantes', categoryName: 'Diamantes', categoryId: 7, description: 'Diamante natural de corte brillante redondo con 1.5 quilates. Certificado GIA con claridad VS1 y color F. Ideal para engaste en anillo o dije.', basePrice: 95000, images: ['images/products/diamantes/diamante-1.jpg'], options: { 'Certificación': ['GIA', 'AGS'] }, active: true, featured: true, sku: 'DIA-001' },
      { id: 20, name: 'Diamante Corte Princess 2.0ct', slug: 'diamante-princess-2ct', category: 'diamantes', categoryName: 'Diamantes', categoryId: 7, description: 'Impresionante diamante con corte princess de 2.0 quilates. Su forma cuadrada maximiza el brillo y el fuego del diamante.', basePrice: 150000, images: ['images/products/diamantes/diamante-2.jpg'], options: { 'Certificación': ['GIA', 'IGI'] }, active: true, featured: true, sku: 'DIA-002' },
      { id: 21, name: 'Par de Diamantes Corte Oval 0.8ct c/u', slug: 'diamantes-oval-par', category: 'diamantes', categoryName: 'Diamantes', categoryId: 7, description: 'Par de diamantes ovales perfectamente emparejados, 0.8 quilates cada uno. Ideales para aretes o pendientes.', basePrice: 72000, images: ['images/products/diamantes/diamante-3.jpg'], options: { 'Certificación': ['GIA'] }, active: true, featured: false, sku: 'DIA-003' },
      // Religiosos
      { id: 22, name: 'Cruz de Oro con Diamantes Full Iced', slug: 'cruz-oro-full-iced', category: 'religiosos', categoryName: 'Religiosos', categoryId: 8, description: 'Cruz elaborada en oro macizo, completamente cubierta de micro-diamantes. Una pieza devocional que combina fe y artesanía de alta joyería.', basePrice: 35000, images: ['images/products/religiosos/religioso-1.png'], options: { 'Kilates': ['10k', '14k', '18k'], 'Cadena': ['Sin cadena', 'Cadena 20"', 'Cadena 24"'] }, active: true, featured: true, sku: 'REL-R01' },
      { id: 23, name: 'San Judas Tadeo de Oro con Piedras', slug: 'san-judas-oro-piedras', category: 'religiosos', categoryName: 'Religiosos', categoryId: 8, description: 'Dije de San Judas Tadeo tallado en oro y adornado con piedras preciosas. Una pieza de gran detalle y devoción.', basePrice: 28000, images: ['images/products/religiosos/religioso-2.png'], options: { 'Kilates': ['10k', '14k'], 'Cadena': ['Sin cadena', 'Cadena 22"', 'Cadena 24"'] }, active: true, featured: false, sku: 'REL-R02' },
      { id: 24, name: 'Virgen de Guadalupe de Oro con Brillantes', slug: 'virgen-guadalupe-oro', category: 'religiosos', categoryName: 'Religiosos', categoryId: 8, description: 'Hermosa imagen de la Virgen de Guadalupe elaborada en oro con brillantes incrustados. Una pieza devocional de gran valor artístico.', basePrice: 32000, images: ['images/products/religiosos/religioso-3.png'], options: { 'Kilates': ['10k', '14k', '18k'], 'Cadena': ['Sin cadena', 'Cadena 20"', 'Cadena 22"'] }, active: true, featured: false, sku: 'REL-R03' }
    ];
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
