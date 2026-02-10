/**
 * Orders API Routes — Direct PostgreSQL
 */
const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// Order Status Enum
const STATUS = {
    SENT: 'sent_to_whatsapp',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// POST /api/orders — Create a new order (public checkout)
router.post('/', async (req, res, next) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const { customer, items, subtotal, shipping_cost, discount, total, payment_method, notes, whatsapp_message } = req.body;

        if (!customer || !items || !items.length) {
            return res.status(400).json({ error: 'Datos del pedido incompletos' });
        }

        // 1. Create client if not exists (or update)
        // Check if email exists
        const { rows: existingCustomers } = await client.query(
            'SELECT id FROM customers WHERE email = $1',
            [customer.email]
        );

        let customerId;

        if (existingCustomers.length > 0) {
            customerId = existingCustomers[0].id;
            // Update address info
            await client.query(`
        UPDATE customers 
        SET name=$1, phone=$2, street=$3, colony=$4, city=$5, state=$6, zip_code=$7, address_references=$8
        WHERE id=$9
      `, [customer.name, customer.phone, customer.street || '',
            customer.colony || '', customer.city || '', customer.state || '',
            customer.zip_code || '', customer.address_references || '', customerId]);
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
        const { rows: numRows } = await client.query('SELECT generate_order_number()');
        const orderNumber = numRows[0].generate_order_number;

        // 3. Create order
        // Status definition:
        // - 'sent_to_whatsapp': Created when user clicks "Confirmar por WhatsApp". 
        //   Requires admin manual confirmation to proceed.
        const { rows: orderRows } = await client.query(`
      INSERT INTO orders (
        order_number, customer_id, subtotal, shipping_cost, discount, total, 
        payment_method, notes, status, source, last_status_changed_at, whatsapp_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11) 
      RETURNING *
    `, [
            orderNumber,
            customerId,
            subtotal || 0,
            shipping_cost || 150,
            discount || 0,
            total || 0,
            payment_method || 'oxxo',
            notes || '',
            STATUS.SENT, // Initial status
            'whatsapp',  // Default source
            whatsapp_message || ''
        ]);

        const order = orderRows[0];

        // 4. Create order items
        for (const item of items) {
            await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, product_sku, selected_options, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [order.id, item.id || null, item.name, item.sku || null,
            JSON.stringify(item.options || []), item.quantity, item.price, item.price * item.quantity]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            order: {
                id: order.id,
                order_number: order.order_number,
                total: order.total,
                status: order.status,
                created_at: order.created_at,
                source: order.source,
                whatsapp_message: order.whatsapp_message
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
            // Find by order_number
            sql = 'SELECT * FROM orders WHERE order_number = $1';
            params = [id];
        } else {
            // Find by ID
            sql = 'SELECT * FROM orders WHERE id = $1';
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
            if (status === 'pending') {
                // Legacy support: 'pending' might exist in old rows, but logic uses sent_to_whatsapp
                whereClauses.push(`o.status IN ('pending', '${STATUS.SENT}')`);
            } else {
                whereClauses.push(`o.status = $${paramIndex++}`);
                params.push(status);
            }
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Count query
        const { rows: countRows } = await query(`SELECT COUNT(*) FROM orders o ${whereSQL}`, params);
        const total = parseInt(countRows[0].count);

        // Data query
        const { rows } = await query(`
      SELECT o.*,
        json_build_object('name', cu.name, 'email', cu.email, 'phone', cu.phone) AS customer,
        COALESCE((SELECT json_agg(json_build_object(
          'name', oi.product_name,
          'quantity', oi.quantity,
          'price', oi.unit_price
        )) FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items
      FROM orders o
      JOIN customers cu ON o.customer_id = cu.id
      ${whereSQL}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, parseInt(limit), parseInt(offset)]);

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

// PATCH /api/orders/:id/status — Update order status (admin only)
router.patch('/:id/status', requireAuth, requireRole('superadmin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, tracking_number, notes, payment_reference } = req.body;

        // Validation: Check valid transitions
        const { rows: currentOrderRows } = await query('SELECT status FROM orders WHERE id = $1', [id]);
        if (currentOrderRows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        const currentStatus = currentOrderRows[0].status;

        // Simple validation rules
        if (status) {
            if (currentStatus === STATUS.SENT && status === STATUS.SHIPPED) {
                return res.status(400).json({ error: 'Debe confirmar el pedido antes de enviarlo.' });
            }
            if (currentStatus === STATUS.CONFIRMED && status === STATUS.SENT) {
                return res.status(400).json({ error: 'No se puede regresar un pedido confirmado a revisión.' });
            }
        }

        const setClauses = [];
        const params = [id];
        let paramIndex = 2;

        if (status) {
            setClauses.push(`status = $${paramIndex++}`);
            setClauses.push(`last_status_changed_at = NOW()`);
            params.push(status);

            // Handle transition to CONFIRMED
            if (status === STATUS.CONFIRMED && currentStatus !== STATUS.CONFIRMED) {
                setClauses.push(`intent_confirmed_at = NOW()`);
                setClauses.push(`admin_confirmed_by = $${paramIndex++}`);
                params.push(req.admin.id);
            }

            // Handle transition to SHIPPED
            if (status === STATUS.SHIPPED && currentStatus !== STATUS.SHIPPED) {
                setClauses.push(`shipped_at = NOW()`);
            }
            // Handle transition to DELIVERED
            if (status === STATUS.DELIVERED && currentStatus !== STATUS.DELIVERED) {
                setClauses.push(`delivered_at = NOW()`);
            }
        }

        if (tracking_number !== undefined) {
            setClauses.push(`tracking_number = $${paramIndex++}`);
            params.push(tracking_number);
        }

        if (notes !== undefined) {
            setClauses.push(`notes = $${paramIndex++}`);
            params.push(notes);
        }

        if (payment_reference !== undefined) {
            setClauses.push(`payment_reference = $${paramIndex++}`);
            params.push(payment_reference);
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        const { rows } = await query(`
      UPDATE orders
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params);

        res.json({ order: rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
