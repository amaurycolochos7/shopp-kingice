/**
 * Orders API Routes — Direct PostgreSQL
 */
const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/orders — Create a new order (public checkout)
router.post('/', async (req, res, next) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const { customer, items, subtotal, shipping_cost, discount, total, payment_method, notes } = req.body;

        if (!customer || !items || !items.length) {
            return res.status(400).json({ error: 'Cliente e items son requeridos' });
        }

        if (!customer.name || !customer.email || !customer.phone) {
            return res.status(400).json({ error: 'Nombre, email y teléfono son requeridos' });
        }

        // 1. Create or find customer
        const { rows: existingRows } = await client.query(
            'SELECT id FROM customers WHERE email = $1', [customer.email]
        );

        let customerId;

        if (existingRows.length > 0) {
            const { rows } = await client.query(`
        UPDATE customers SET name=$1, phone=$2, street=$3, colony=$4, city=$5, state=$6, zip_code=$7, address_references=$8
        WHERE id=$9 RETURNING id
      `, [customer.name, customer.phone, customer.street || '', customer.colony || '',
            customer.city || '', customer.state || '', customer.zip_code || '',
            customer.address_references || '', existingRows[0].id]);
            customerId = rows[0].id;
        } else {
            const { rows } = await client.query(`
        INSERT INTO customers (name, email, phone, street, colony, city, state, zip_code, address_references)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [customer.name, customer.email, customer.phone, customer.street || '',
            customer.colony || '', customer.city || '', customer.state || '',
            customer.zip_code || '', customer.address_references || '']);
            customerId = rows[0].id;
        }

        // 2. Generate order number
        const { rows: numRows } = await client.query('SELECT generate_order_number() AS order_number');
        const orderNumber = numRows[0].order_number || `ORD-${Date.now()}`;

        // 3. Create order
        const { rows: orderRows } = await client.query(`
      INSERT INTO orders (order_number, customer_id, subtotal, shipping_cost, discount, total, payment_method, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [orderNumber, customerId, subtotal || 0, shipping_cost || 150, discount || 0,
            total || 0, payment_method || 'oxxo', notes || '']);

        const order = orderRows[0];

        // 4. Create order items
        for (const item of items) {
            await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, product_sku, selected_options, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [order.id, item.product_id || null, item.name, item.sku || null,
            item.options ? JSON.stringify(item.options) : null,
            item.quantity, item.price, item.price * item.quantity]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            order: {
                id: order.id,
                order_number: order.order_number,
                total: order.total,
                status: order.status,
                created_at: order.created_at
            },
            message: 'Pedido creado exitosamente'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// GET /api/orders/:id — Get order details (public — for confirmation page)
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        let sql, params;
        if (isNaN(id)) {
            // Search by order_number
            sql = `
        SELECT o.*,
          row_to_json(cu.*) AS customer,
          COALESCE((SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items
        FROM orders o
        JOIN customers cu ON o.customer_id = cu.id
        WHERE o.order_number = $1
      `;
            params = [id];
        } else {
            sql = `
        SELECT o.*,
          row_to_json(cu.*) AS customer,
          COALESCE((SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items
        FROM orders o
        JOIN customers cu ON o.customer_id = cu.id
        WHERE o.id = $1
      `;
            params = [id];
        }

        const { rows } = await query(sql, params);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ order: rows[0] });
    } catch (err) {
        next(err);
    }
});

// GET /api/orders — List all orders (admin only)
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let paramIndex = 1;

        let whereClauses = [];
        if (status) {
            whereClauses.push(`o.status = $${paramIndex++}`);
            params.push(status);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Count
        const countParams = [...params];
        const { rows: countRows } = await query(
            `SELECT COUNT(*) FROM orders o ${whereSQL}`, countParams
        );
        const total = parseInt(countRows[0].count);

        // Data
        params.push(parseInt(limit), parseInt(offset));
        const { rows } = await query(`
      SELECT o.*,
        json_build_object('id', cu.id, 'name', cu.name, 'email', cu.email, 'phone', cu.phone) AS customer,
        COALESCE((SELECT json_agg(json_build_object(
          'id', oi.id, 'product_name', oi.product_name, 'quantity', oi.quantity,
          'unit_price', oi.unit_price, 'subtotal', oi.subtotal
        )) FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items
      FROM orders o
      JOIN customers cu ON o.customer_id = cu.id
      ${whereSQL}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, params);

        res.json({
            orders: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/orders/:id — Update order status (admin only)
router.patch('/:id', requireAuth, requireRole('superadmin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, tracking_number, notes, payment_reference } = req.body;

        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        if (status) {
            setClauses.push(`status = $${paramIndex++}`);
            params.push(status);
            if (status === 'paid') { setClauses.push(`payment_confirmed_at = NOW()`); }
            if (status === 'shipped') { setClauses.push(`shipped_at = NOW()`); }
            if (status === 'delivered') { setClauses.push(`delivered_at = NOW()`); }
        }
        if (tracking_number) { setClauses.push(`tracking_number = $${paramIndex++}`); params.push(tracking_number); }
        if (notes) { setClauses.push(`notes = $${paramIndex++}`); params.push(notes); }
        if (payment_reference) { setClauses.push(`payment_reference = $${paramIndex++}`); params.push(payment_reference); }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        params.push(id);
        const { rows } = await query(
            `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ order: rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
