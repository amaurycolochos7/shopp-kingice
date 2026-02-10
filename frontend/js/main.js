/**
 * KING ICE GOLD - JavaScript Principal
 * Funcionalidad general de la tienda
 */

// Wait for API data to load, then initialize
window.addEventListener('kig:ready', function () {
  initCategories();
  initFeaturedProducts();
  initCategoriesShowcase();
  initMobileMenu();
  initAdminAccess();
  initSearch();
});

// Fallback: if kig:ready already fired before this script loaded
document.addEventListener('DOMContentLoaded', function () {
  // Check if data is already loaded
  if (KIG.Products.getAll().length > 0 || KIG.Collections.getAll().length > 0) {
    initCategories();
    initFeaturedProducts();
    initCategoriesShowcase();
    initMobileMenu();
    initAdminAccess();
    initSearch();
  }
});

// ==================== CATEGORÍAS ====================

function initCategories() {
  const categoriesNav = document.getElementById('categoriesNav');
  const footerCategories = document.getElementById('footerCategories');
  const mobileMenuNav = document.getElementById('mobileMenuNav');

  if (!categoriesNav) return;

  const collections = KIG.Collections.getAll();

  // Nav principal
  categoriesNav.innerHTML = collections
    .sort((a, b) => a.order - b.order)
    .map(col => `<li><a href="collection.html?category=${col.slug}">${col.name.toUpperCase()}</a></li>`)
    .join('');

  // Footer
  if (footerCategories) {
    footerCategories.innerHTML = collections
      .slice(0, 6)
      .map(col => `<li><a href="collection.html?category=${col.slug}">${col.name}</a></li>`)
      .join('');
  }

  // Mobile menu
  if (mobileMenuNav) {
    mobileMenuNav.innerHTML = `
      <a href="index.html">Inicio</a>
      <a href="collection.html">Colección</a>
      ${collections.map(col => `<a href="collection.html?category=${col.slug}">${col.name}</a>`).join('')}
      <a href="about.html">Sobre Nosotros</a>
      <a href="cart.html">Carrito</a>
    `;
  }
}

// ==================== PRODUCTOS DESTACADOS ====================

function initFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;

  const products = KIG.Products.getFeatured(8);

  if (products.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No hay productos disponibles aún.</p>';
    return;
  }

  container.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const imageUrl = product.images[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%231a1a1a" width="400" height="400"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="20" text-anchor="middle" x="200" y="205"%3ESin imagen%3C/text%3E%3C/svg%3E';

  return `
    <article class="product-card">
      <a href="product.html?id=${product.id}">
        <div class="product-card-image">
          <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-card-body">
          <h3 class="product-card-title">${product.name}</h3>
          <div class="product-card-price">
            <span class="from">Desde</span>
            <span class="amount">${KIG.formatPrice(product.basePrice)}</span>
          </div>
          <button class="btn btn-dark btn-sm btn-block">SELECCIONAR OPCIONES</button>
        </div>
      </a>
    </article>
  `;
}

// ==================== SHOWCASE DE CATEGORÍAS ====================

function initCategoriesShowcase() {
  const container = document.getElementById('categoriesShowcase');
  if (!container) return;

  const collections = KIG.Collections.getAll().slice(0, 6);

  container.innerHTML = collections.map(col => {
    const bgImage = col.image ? `url('${col.image}')` : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)';
    return `
    <a href="collection.html?category=${col.slug}" class="category-showcase-card" style="
      display: block;
      position: relative;
      aspect-ratio: 1;
      background: ${bgImage};
      background-size: cover;
      background-position: center;
      border-radius: var(--border-radius-md);
      overflow: hidden;
      transition: transform var(--transition-normal);
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%);
      "></div>
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: var(--spacing-lg);
      ">
        <h3 style="color: white; font-size: 1.25rem;">${col.name}</h3>
      </div>
    </a>
  `}).join('');

  // Hover effect
  container.querySelectorAll('.category-showcase-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.transform = 'scale(1.02)');
    card.addEventListener('mouseleave', () => card.style.transform = 'scale(1)');
  });
}

// ==================== MENÚ MÓVIL ====================

function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const close = document.getElementById('mobileMenuClose');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  if (close) {
    close.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Cerrar al hacer clic en un enlace
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ==================== ACCESO OCULTO AL ADMIN ====================

function initAdminAccess() {
  const adminAccess = document.getElementById('adminAccess');
  if (!adminAccess) return;

  let clickCount = 0;
  let clickTimer;

  adminAccess.addEventListener('click', () => {
    clickCount++;

    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 1000);

    // 5 clics rápidos para acceder
    if (clickCount >= 5) {
      window.location.href = 'admin/login.html';
    }
  });
}

// ==================== BÚSQUEDA ====================

function initSearch() {
  const searchIcon = document.getElementById('searchIcon');
  if (!searchIcon) return;

  searchIcon.addEventListener('click', (e) => {
    e.preventDefault();
    const query = prompt('Buscar productos:');
    if (query && query.trim()) {
      window.location.href = `collection.html?search=${encodeURIComponent(query.trim())}`;
    }
  });
}

// ==================== UTILIDADES GLOBALES ====================

// Mostrar notificación toast
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast alert alert-${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Exponer globalmente
window.showToast = showToast;
