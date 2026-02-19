/**
 * KING ICE GOLD - JavaScript Principal
 * Funcionalidad general de la tienda
 */

// Wait for API data to load, then initialize
window.addEventListener('kig:ready', function () {
  initCategories();
  initFeaturedProducts();
  initHighlightedProducts();
  initCategoriesShowcase();
  initCategoryCarousel();
  initMobileMenu();
  initAdminAccess();
  initSearch();
  initScrollReveal();
  initCarousels();
});

// Fallback: if kig:ready already fired before this script loaded
document.addEventListener('DOMContentLoaded', function () {
  initHeaderScroll();
  initScrollReveal();
  initBeforeAfterSlider();
  initScrollToTop();
  initNewsletter();
  initParticles();

  // Check if data is already loaded
  if (typeof KIG !== 'undefined' && KIG.Products.getAll().length > 0 || (typeof KIG !== 'undefined' && KIG.Collections.getAll().length > 0)) {
    initCategories();
    initFeaturedProducts();
    initHighlightedProducts();
    initCategoriesShowcase();
    initCategoryCarousel();
    initMobileMenu();
    initAdminAccess();
    initSearch();
    initCarousels();
  }
});

// ==================== HEADER SCROLL EFFECT ====================

function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ==================== SCROLL REVEAL ====================

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');

  if (!revealElements.length) return;
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => { el.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(function (el) {
    observer.observe(el);
  });
}

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
      <a href="boutique.html">Boutique</a>
      ${collections.map(col => `<a href="collection.html?category=${col.slug}">${col.name}</a>`).join('')}
      <a href="about.html">Sobre Nosotros</a>
      <a href="servicio-cliente.html">Servicio al cliente</a>
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

function initHighlightedProducts() {
  const container = document.getElementById('highlightedProducts');
  if (!container) return;

  const all = KIG.Products.getAll();
  // Show different products than featured — grab the second batch
  const highlighted = all.slice(8, 16).length > 0 ? all.slice(8, 16) : all.slice(0, 8);

  if (highlighted.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No hay productos disponibles aún.</p>';
    return;
  }

  container.innerHTML = highlighted.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const imageUrl = product.images[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23111" width="400" height="400"/%3E%3Ctext fill="%23444" font-family="sans-serif" font-size="18" text-anchor="middle" x="200" y="205"%3ESin imagen%3C/text%3E%3C/svg%3E';

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
          <button class="btn btn-dark btn-sm btn-block add-to-cart-btn">SELECCIONAR OPCIONES</button>
        </div>
      </a>
    </article>
  `;
}

// ==================== CAROUSELS ====================

function initCarousels() {
  document.querySelectorAll('.carousel-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const scrollAmount = target.clientWidth * 0.7;
      const dir = btn.classList.contains('carousel-arrow-left') ? -1 : 1;
      target.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    });
  });

  // Auto-scroll
  document.querySelectorAll('.carousel-track').forEach(track => {
    let interval;
    const startAutoScroll = () => {
      interval = setInterval(() => {
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }, 4000);
    };
    startAutoScroll();
    track.addEventListener('mouseenter', () => clearInterval(interval));
    track.addEventListener('mouseleave', () => startAutoScroll());
  });
}

// ==================== SHOWCASE DE CATEGORÍAS ====================

function initCategoriesShowcase() {
  const container = document.getElementById('categoriesShowcase');
  if (!container) return;

  const collections = KIG.Collections.getAll().slice(0, 6);

  container.innerHTML = collections.map(col => {
    const bgImage = col.image
      ? `<img src="${col.image}" alt="${col.name}" loading="lazy">`
      : '';
    const bgStyle = !col.image ? 'background: linear-gradient(135deg, #111 0%, #222 100%);' : '';
    return `
    <a href="collection.html?category=${col.slug}" class="category-card" style="${bgStyle}">
      ${bgImage}
      <div class="category-card-overlay">
        <h3>${col.name}</h3>
      </div>
    </a>
  `}).join('');
}

// ==================== FLY CART ANIMATION ====================

function flyToCart(fromEl) {
  if (!fromEl) return;

  var cartSelectors = [
    '.header-icon[href*="cart"]',
    'a.cart-contents',
    '.ast-site-header-cart a',
    'a[href*="cart"]'
  ];

  var cartEl = null;
  for (var i = 0; i < cartSelectors.length; i++) {
    var el = document.querySelector(cartSelectors[i]);
    if (el && el.getBoundingClientRect().width > 0) { cartEl = el; break; }
  }

  var fromRect = fromEl.getBoundingClientRect();
  var toRect = cartEl ? cartEl.getBoundingClientRect() : { left: window.innerWidth - 30, top: 20, width: 1, height: 1 };

  var startX = fromRect.left + fromRect.width / 2;
  var startY = fromRect.top + fromRect.height / 2;
  var endX = toRect.left + Math.min(toRect.width, 40) / 2;
  var endY = toRect.top + Math.min(toRect.height, 40) / 2;

  var flyer = document.createElement('div');
  flyer.className = 'rj-fly-cart-flyer';

  // Try to find closest product image
  var container = fromEl.closest('.product-card, .product, li.product');
  var imgEl = container ? container.querySelector('img') : null;

  if (imgEl && (imgEl.currentSrc || imgEl.src)) {
    var img = document.createElement('img');
    img.src = imgEl.currentSrc || imgEl.src;
    img.alt = '';
    flyer.appendChild(img);
  } else {
    flyer.classList.add('rj-fly-cart-dot');
  }

  flyer.style.left = (startX - 26) + 'px';
  flyer.style.top = (startY - 26) + 'px';
  document.body.appendChild(flyer);
  flyer.getBoundingClientRect(); // reflow

  var dx = endX - startX;
  var dy = endY - startY;
  var DURATION = 650;

  flyer.style.transition = 'transform ' + DURATION + 'ms cubic-bezier(.2,.8,.2,1), opacity ' + DURATION + 'ms ease';
  flyer.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(0.22)';
  flyer.style.opacity = '0.25';

  setTimeout(function () {
    if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
    if (cartEl) {
      cartEl.classList.remove('rj-fly-cart-pop');
      void cartEl.offsetWidth;
      cartEl.classList.add('rj-fly-cart-pop');
      setTimeout(function () { cartEl.classList.remove('rj-fly-cart-pop'); }, 360);
    }
  }, DURATION + 30);
}

// Listen for add to cart events
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.add-to-cart-btn, .single_add_to_cart_button, [data-add-to-cart]');
  if (btn) {
    flyToCart(btn);
  }
});

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
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchClose = document.getElementById('searchModalClose');
  const searchOverlay = searchModal ? searchModal.querySelector('.search-modal-overlay') : null;

  if (!searchIcon || !searchModal || !searchInput) return;

  // Open modal
  searchIcon.addEventListener('click', (e) => {
    e.preventDefault();
    searchModal.classList.add('active');
    setTimeout(() => searchInput.focus(), 100);
  });

  // Close modal
  function closeSearch() {
    searchModal.classList.remove('active');
    searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  }

  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchOverlay) searchOverlay.addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal.classList.contains('active')) closeSearch();
  });

  // Live search
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query || query.length < 2) {
        searchResults.innerHTML = '';
        return;
      }

      const products = KIG.Products.getAll();
      const matches = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      ).slice(0, 8);

      if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No se encontraron productos</div>';
        return;
      }

      searchResults.innerHTML = matches.map(p => `
        <div class="search-result-item" onclick="window.location.href='product.html?id=${p.id}'">
          <img src="${p.images[0]}" alt="${p.name}" onerror="this.src='images/placeholder.png'">
          <div class="result-info">
            <div class="result-name">${p.name}</div>
            <div class="result-category">${p.categoryName || p.category}</div>
          </div>
          <div class="result-price">${KIG.formatPrice(p.basePrice)}</div>
        </div>
      `).join('');
    }, 250);
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
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(8px);
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

// ==================== BEFORE/AFTER SLIDER ====================

function initBeforeAfterSlider() {
  const slider = document.getElementById('baRange');
  const handle = document.getElementById('baHandle');
  const afterEl = document.querySelector('.ba-after');
  const beforeEl = document.querySelector('.ba-before');
  if (!slider || !handle || !afterEl) return;

  function updateSlider(value) {
    const pct = value;
    if (beforeEl) beforeEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    afterEl.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = pct + '%';
  }

  slider.addEventListener('input', function () {
    updateSlider(this.value);
  });

  slider.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });

  updateSlider(50);
}

// ==================== SCROLL TO TOP ====================

function initScrollToTop() {
  const btn = document.getElementById('scrollToTop');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==================== VIGNETTE EFFECT ====================

function initVignette() {
  const left = document.querySelector('.vignette-left');
  const right = document.querySelector('.vignette-right');
  if (!left || !right) return;

  // Only on desktop
  if (window.innerWidth < 768) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 300) {
      left.classList.add('active');
      right.classList.add('active');
    } else {
      left.classList.remove('active');
      right.classList.remove('active');
    }
  }, { passive: true });
}

// ==================== CATEGORY CAROUSEL ====================

function initCategoryCarousel() {
  const container = document.getElementById('categoryCarousel');
  if (!container) return;

  const collections = KIG.Collections.getAll();
  container.innerHTML = collections.map(col => {
    return `
      <a href="collection.html?category=${col.slug}" class="category-carousel-item">
        <img src="${col.image}" alt="${col.name}" onerror="this.style.display='none'">
        <span>${col.name}</span>
      </a>
    `;
  }).join('');
}

// ==================== HIGHLIGHTED PRODUCTS ====================

function initHighlightedProducts() {
  const container = document.getElementById('highlightedProducts');
  if (!container) return;

  const products = KIG.Products.getAll();
  // Take last 4 products as "destacados" or shuffle
  const highlighted = products.slice(-4);

  if (highlighted.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No hay productos disponibles aún.</p>';
    return;
  }

  container.innerHTML = highlighted.map(product => createProductCard(product)).join('');
}

// ==================== NEWSLETTER ====================

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]');
    if (email && email.value) {
      showToast('¡Gracias por suscribirte! Te mantendremos informado.', 'success');
      email.value = '';
    }
  });
}

// Exponer globalmente
window.showToast = showToast;
window.flyToCart = flyToCart;

// ==================== GOLDEN PARTICLES ====================

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  // Only on desktop for performance
  if (window.innerWidth < 768) return;

  const count = 15;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.width = (Math.random() * 3 + 1) + 'px';
    particle.style.height = particle.style.width;
    particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
    particle.style.animationDelay = (Math.random() * 10) + 's';
    container.appendChild(particle);
  }
}
