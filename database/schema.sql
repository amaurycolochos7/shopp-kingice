-- =====================================================
-- KING ICE GOLD - Script de Creación de Base de Datos
-- Compatible con MySQL 8.0+ / MariaDB 10.5+
-- =====================================================

-- Crear base de datos (descomentar si es necesario)
-- CREATE DATABASE IF NOT EXISTS king_ice_gold 
--   CHARACTER SET utf8mb4 
--   COLLATE utf8mb4_unicode_ci;
-- USE king_ice_gold;

-- =====================================================
-- TABLA: admins
-- Administradores del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role ENUM('superadmin', 'admin', 'viewer') NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_admins_username (username),
  INDEX idx_admins_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: admin_sessions
-- Sesiones activas de administradores
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_sessions_token (token),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: categories
-- Categorías de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_active (active),
  INDEX idx_categories_order (display_order)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: products
-- Catálogo de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  sku VARCHAR(50) NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title VARCHAR(200) NULL,
  meta_description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_slug (slug),
  INDEX idx_products_active (active),
  INDEX idx_products_featured (featured),
  CONSTRAINT chk_products_price CHECK (base_price >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: product_images
-- Imágenes de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(200) NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_images_product (product_id),
  INDEX idx_images_primary (is_primary)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: product_options
-- Opciones configurables de productos (talla, color, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_options (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  option_name VARCHAR(50) NOT NULL,
  option_values JSON NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_options_product (product_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: customers
-- Clientes (sin cuenta, solo datos de envío)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  street VARCHAR(200) NOT NULL,
  colony VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  address_references TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_customers_email (email),
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: orders
-- Pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT UNSIGNED NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 150.00,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'oxxo',
  payment_reference VARCHAR(50) NULL,
  payment_confirmed_at DATETIME NULL,
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  tracking_number VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  INDEX idx_orders_number (order_number),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at),
  CONSTRAINT chk_orders_total CHECK (total >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: order_items
-- Productos dentro de cada pedido
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NULL,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(50) NULL,
  selected_options JSON NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_items_order (order_id),
  CONSTRAINT chk_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: order_status_history
-- Historial de cambios de estado de pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL,
  changed_by INT UNSIGNED NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_history_order (order_id),
  INDEX idx_history_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TABLA: activity_log
-- Registro de actividad para auditoría y seguridad
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT UNSIGNED NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_log_admin (admin_id),
  INDEX idx_log_entity (entity_type, entity_id),
  INDEX idx_log_action (action),
  INDEX idx_log_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- TRIGGER: Registrar cambios de estado de pedidos
-- =====================================================
DELIMITER //
CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO order_status_history (order_id, status, note)
    VALUES (NEW.id, NEW.status, CONCAT('Cambio de ', OLD.status, ' a ', NEW.status));
  END IF;
END //
DELIMITER ;

-- =====================================================
-- TRIGGER: Crear historial inicial al crear pedido
-- =====================================================
DELIMITER //
CREATE TRIGGER trg_order_created
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  INSERT INTO order_status_history (order_id, status, note)
  VALUES (NEW.id, NEW.status, 'Pedido creado');
END //
DELIMITER ;

-- =====================================================
-- FUNCIÓN: Generar número de pedido único
-- =====================================================
DELIMITER //
CREATE FUNCTION generate_order_number()
RETURNS VARCHAR(30)
DETERMINISTIC
BEGIN
  DECLARE today_date VARCHAR(8);
  DECLARE order_count INT;
  DECLARE new_number VARCHAR(30);
  
  SET today_date = DATE_FORMAT(NOW(), '%Y%m%d');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING_INDEX(order_number, '-', -1) AS UNSIGNED)
  ), 0) + 1 INTO order_count
  FROM orders 
  WHERE order_number LIKE CONCAT('ORD-', today_date, '-%');
  
  SET new_number = CONCAT('ORD-', today_date, '-', LPAD(order_count, 3, '0'));
  
  RETURN new_number;
END //
DELIMITER ;

-- =====================================================
-- DATOS INICIALES: Administrador por defecto
-- Contraseña: kingice2026 (hash bcrypt)
-- =====================================================
INSERT INTO admins (username, password_hash, email, role) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.WqqjIfOVCXB2Gy', 'admin@kingicegold.com', 'superadmin');

-- =====================================================
-- DATOS INICIALES: Categorías por defecto
-- =====================================================
INSERT INTO categories (name, slug, display_order, active) VALUES
('Cadenas', 'cadenas', 1, TRUE),
('Anillos', 'anillos', 2, TRUE),
('Aretes', 'aretes', 3, TRUE),
('Pulsos', 'pulsos', 4, TRUE),
('Dijes', 'dijes', 5, TRUE),
('Relojes', 'relojes', 6, TRUE);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
