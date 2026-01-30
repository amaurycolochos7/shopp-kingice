/**
 * KING ICE GOLD - Cliente de Supabase
 * 
 * Este módulo maneja todas las operaciones con la base de datos.
 * Reemplaza las funciones de localStorage cuando se active.
 */

// Inicializar cliente de Supabase
let supabase = null;

async function initSupabase() {
    if (supabase) return supabase;

    // Importar Supabase dinámicamente
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase inicializado');

    return supabase;
}

// =====================================================
// MÓDULO: Categorías
// =====================================================
const SupabaseCategories = {
    async getAll() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('active', true)
            .order('display_order');

        if (error) {
            console.error('Error cargando categorías:', error);
            return [];
        }
        return data;
    },

    async getBySlug(slug) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) return null;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }
};

// =====================================================
// MÓDULO: Productos
// =====================================================
const SupabaseProducts = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(name, slug),
        images:product_images(image_url, alt_text, is_primary),
        options:product_options(option_name, option_values)
      `)
            .eq('active', true);

        if (error) {
            console.error('Error cargando productos:', error);
            return [];
        }

        // Transformar para compatibilidad con frontend existente
        return data.map(p => ({
            id: p.id.toString(),
            name: p.name,
            slug: p.slug,
            category: p.category?.slug || '',
            description: p.description,
            basePrice: p.base_price,
            price: p.base_price,
            active: p.active,
            featured: p.featured,
            images: p.images.map(img => img.image_url),
            options: p.options.reduce((acc, opt) => {
                acc[opt.option_name] = JSON.parse(opt.option_values);
                return acc;
            }, {})
        }));
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(name, slug),
        images:product_images(image_url, alt_text, is_primary),
        options:product_options(option_name, option_values)
      `)
            .eq('id', parseInt(id))
            .single();

        if (error) return null;

        return {
            id: data.id.toString(),
            name: data.name,
            slug: data.slug,
            category: data.category?.slug || '',
            description: data.description,
            basePrice: data.base_price,
            price: data.base_price,
            active: data.active,
            featured: data.featured,
            images: data.images.map(img => img.image_url),
            options: data.options.reduce((acc, opt) => {
                acc[opt.option_name] = JSON.parse(opt.option_values);
                return acc;
            }, {})
        };
    },

    async getByCategory(categorySlug) {
        const products = await this.getAll();
        return products.filter(p => p.category === categorySlug);
    },

    async getFeatured() {
        const products = await this.getAll();
        return products.filter(p => p.featured);
    }
};

// =====================================================
// MÓDULO: Pedidos
// =====================================================
const SupabaseOrders = {
    async create(orderData) {
        // 1. Crear cliente
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .insert({
                name: orderData.customer.name,
                email: orderData.customer.email,
                phone: orderData.customer.phone,
                street: orderData.customer.address.street,
                colony: orderData.customer.address.colony,
                city: orderData.customer.address.city,
                state: orderData.customer.address.state,
                zip_code: orderData.customer.address.zip,
                address_references: orderData.customer.address.references
            })
            .select()
            .single();

        if (customerError) {
            console.error('Error creando cliente:', customerError);
            throw customerError;
        }

        // 2. Generar número de pedido
        const { data: orderNumber } = await supabase
            .rpc('generate_order_number');

        // 3. Crear pedido
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                customer_id: customer.id,
                subtotal: orderData.subtotal,
                shipping_cost: orderData.shipping,
                total: orderData.total,
                status: 'pending',
                payment_method: 'oxxo'
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creando pedido:', orderError);
            throw orderError;
        }

        // 4. Crear items del pedido
        const items = orderData.items.map(item => ({
            order_id: order.id,
            product_id: parseInt(item.productId) || null,
            product_name: item.name,
            selected_options: item.options,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(items);

        if (itemsError) {
            console.error('Error creando items:', itemsError);
            throw itemsError;
        }

        return {
            id: order.id.toString(),
            orderNumber: order.order_number,
            ...orderData,
            status: 'pending',
            createdAt: order.created_at
        };
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        customer:customers(*),
        items:order_items(*),
        history:order_status_history(*)
      `)
            .eq('id', parseInt(id))
            .single();

        if (error) return null;
        return data;
    }
};

// =====================================================
// MÓDULO: Admin (Solo con service_role - backend)
// =====================================================
// NOTA: Las funciones de admin se deben ejecutar desde un servidor
// con la clave service_role, no desde el frontend.

// =====================================================
// CARRITO (Se mantiene en localStorage)
// =====================================================
const SupabaseCart = {
    // El carrito sigue siendo local
    getItems() {
        return JSON.parse(localStorage.getItem('kig_cart')) || [];
    },

    addItem(item) {
        const cart = this.getItems();
        const existingIndex = cart.findIndex(i =>
            i.productId === item.productId &&
            JSON.stringify(i.options) === JSON.stringify(item.options)
        );

        if (existingIndex > -1) {
            cart[existingIndex].quantity += item.quantity;
        } else {
            cart.push(item);
        }

        localStorage.setItem('kig_cart', JSON.stringify(cart));
        return cart;
    },

    updateQuantity(index, quantity) {
        const cart = this.getItems();
        if (cart[index]) {
            cart[index].quantity = quantity;
            localStorage.setItem('kig_cart', JSON.stringify(cart));
        }
        return cart;
    },

    removeItem(index) {
        const cart = this.getItems();
        cart.splice(index, 1);
        localStorage.setItem('kig_cart', JSON.stringify(cart));
        return cart;
    },

    clear() {
        localStorage.removeItem('kig_cart');
        return [];
    },

    getCount() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    getTotal() {
        return this.getItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
};

// =====================================================
// EXPORTAR MÓDULOS
// =====================================================
window.SupabaseDB = {
    init: initSupabase,
    Categories: SupabaseCategories,
    Products: SupabaseProducts,
    Orders: SupabaseOrders,
    Cart: SupabaseCart
};

// Inicializar automáticamente cuando se carga
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initSupabase();
        console.log('🚀 Base de datos Supabase lista');
    } catch (e) {
        console.warn('⚠️ Supabase no disponible, usando localStorage');
    }
});
