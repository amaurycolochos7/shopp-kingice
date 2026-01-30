-- =====================================================
-- KING ICE GOLD - Script para Supabase (PostgreSQL)
-- =====================================================

-- =====================================================
-- TABLA: categories
-- Categorías de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: products
-- Catálogo de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  sku VARCHAR(50) UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title VARCHAR(200),
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: product_images
-- Imágenes de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(200),
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: product_options
-- Opciones configurables de productos
-- =====================================================
CREATE TABLE IF NOT EXISTS product_options (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_name VARCHAR(50) NOT NULL,
  option_values JSONB NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- TABLA: customers
-- Clientes (sin cuenta, solo datos de envío)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  street VARCHAR(200) NOT NULL,
  colony VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  address_references TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: orders
-- Pedidos
-- =====================================================
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 150.00,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'oxxo',
  payment_reference VARCHAR(50),
  payment_confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: order_items
-- Productos dentro de cada pedido
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(50),
  selected_options JSONB,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- =====================================================
-- TABLA: order_status_history
-- Historial de cambios de estado
-- =====================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  changed_by INT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: admins
-- Administradores del sistema
-- =====================================================
CREATE TYPE admin_role AS ENUM ('superadmin', 'admin', 'viewer');

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  role admin_role NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: admin_sessions
-- Sesiones activas de administradores
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: activity_log
-- Registro de actividad para auditoría
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_options_product ON product_options(product_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_history_order ON order_status_history(order_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_activity_log_admin ON activity_log(admin_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Generar número de pedido
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(30) AS $$
DECLARE
  today_date VARCHAR(8);
  order_count INT;
  new_number VARCHAR(30);
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(order_number, '-', 3) AS INT)
  ), 0) + 1 INTO order_count
  FROM orders 
  WHERE order_number LIKE 'ORD-' || today_date || '-%';
  
  new_number := 'ORD-' || today_date || '-' || LPAD(order_count::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Registrar historial de pedidos
-- =====================================================
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_status_history (order_id, status, note)
    VALUES (NEW.id, NEW.status::TEXT, 'Pedido creado');
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, note)
    VALUES (NEW.id, NEW.status::TEXT, 'Cambio de ' || OLD.status || ' a ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_change
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- =====================================================
-- DATOS INICIALES: Categorías
-- =====================================================
INSERT INTO categories (name, slug, display_order, active) VALUES
('Cadenas', 'cadenas', 1, TRUE),
('Anillos', 'anillos', 2, TRUE),
('Aretes', 'aretes', 3, TRUE),
('Pulsos', 'pulsos', 4, TRUE),
('Dijes', 'dijes', 5, TRUE),
('Relojes', 'relojes', 6, TRUE);

-- =====================================================
-- DATOS INICIALES: Admin por defecto
-- Contraseña: kingice2026 (usar bcrypt en producción)
-- =====================================================
INSERT INTO admins (username, password_hash, email, role) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.WqqjIfOVCXB2Gy', 'admin@kingicegold.com', 'superadmin');

-- =====================================================
-- PRODUCTOS DE EJEMPLO
-- =====================================================
INSERT INTO products (category_id, name, slug, description, base_price, active, featured) VALUES
(1, 'Cadena de Oro Torzal Pavé', 'cadena-oro-torzal-pave', 'Elegante cadena de oro amarillo estilo torzal pavé. Acabado brillante de alta calidad.', 27838.20, TRUE, TRUE),
(1, 'Cadena Tejido Hollow Box', 'cadena-tejido-hollow-box', 'Cadena de oro con tejido hollow box. Diseño moderno y versátil.', 10374.00, TRUE, TRUE),
(2, 'Anillo Solitario Diamante', 'anillo-solitario-diamante', 'Anillo solitario con diamante central de alta calidad.', 15500.00, TRUE, TRUE),
(3, 'Aretes de Oro Huggie', 'aretes-oro-huggie', 'Aretes estilo huggie en oro amarillo. Elegantes y cómodos.', 4500.00, TRUE, TRUE),
(4, 'Pulsera Cubana', 'pulsera-cubana', 'Pulsera estilo cubano en oro. Look urbano y moderno.', 18900.00, TRUE, TRUE),
(5, 'Dije Cruz San Benito', 'dije-cruz-san-benito', 'Dije de cruz San Benito en oro. Símbolo de protección.', 3200.00, TRUE, TRUE);

-- Opciones de productos
INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES
(1, 'medida', '["45cm", "50cm", "55cm", "60cm"]', 1),
(1, 'kilataje', '["10k", "14k"]', 2),
(2, 'medida', '["45cm", "50cm", "55cm", "60cm"]', 1),
(2, 'kilataje', '["10k", "14k"]', 2),
(3, 'talla', '["6", "7", "8", "9", "10"]', 1),
(3, 'kilataje', '["10k", "14k"]', 2),
(4, 'kilataje', '["10k", "14k"]', 1),
(5, 'medida', '["18cm", "20cm", "22cm"]', 1),
(5, 'kilataje', '["10k", "14k"]', 2),
(6, 'tamaño', '["Pequeño", "Mediano", "Grande"]', 1),
(6, 'kilataje', '["10k", "14k"]', 2);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública de productos y categorías
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de categorías activas
CREATE POLICY "Categorías públicas" ON categories FOR SELECT USING (active = TRUE);

-- Permitir lectura pública de productos activos
CREATE POLICY "Productos públicos" ON products FOR SELECT USING (active = TRUE);

-- Permitir lectura pública de imágenes
CREATE POLICY "Imágenes públicas" ON product_images FOR SELECT USING (TRUE);

-- Permitir lectura pública de opciones
CREATE POLICY "Opciones públicas" ON product_options FOR SELECT USING (TRUE);

-- Permitir INSERT en customers y orders para anónimos
CREATE POLICY "Crear clientes anónimos" ON customers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Crear pedidos anónimos" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Crear items anónimos" ON order_items FOR INSERT WITH CHECK (TRUE);

-- Políticas para service_role (acceso total)
CREATE POLICY "Admin full access categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access images" ON product_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access options" ON product_options FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access customers" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access order_history" ON order_status_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access admins" ON admins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access sessions" ON admin_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access activity_log" ON activity_log FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
