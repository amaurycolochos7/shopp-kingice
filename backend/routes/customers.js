/**
 * Customer Auth Routes — Register, Login, Profile
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateCustomerToken, requireCustomerAuth } = require('../middleware/auth');

// POST /api/customers/register
router.post('/register', async (req, res, next) => {
    try {
        const { email, phone, password, name } = req.body;

        if (!email || !phone || !password) {
            return res.status(400).json({ error: 'Email, teléfono y contraseña son requeridos' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
        }

        // Check if email already exists with a password (already registered)
        const { rows: existing } = await query(
            'SELECT id, password_hash FROM customers WHERE email = $1',
            [email]
        );

        if (existing.length > 0 && existing[0].password_hash) {
            return res.status(409).json({ error: 'Este correo ya está registrado. Intenta iniciar sesión.' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        let customerId;

        if (existing.length > 0) {
            // Customer exists from a previous order but has no password — claim the account
            await query(
                'UPDATE customers SET password_hash = $1, phone = $2, name = COALESCE(NULLIF($3, \'\'), name) WHERE id = $4',
                [passwordHash, phone, name || '', existing[0].id]
            );
            customerId = existing[0].id;
        } else {
            // Create new customer
            const { rows } = await query(
                'INSERT INTO customers (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
                [name || '', email, phone, passwordHash]
            );
            customerId = rows[0].id;
        }

        res.status(201).json({
            message: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.',
            customerId
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/customers/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { rows } = await query(
            'SELECT * FROM customers WHERE email = $1',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const customer = rows[0];

        if (!customer.password_hash) {
            return res.status(401).json({ error: 'Esta cuenta no tiene contraseña. Regístrate primero.' });
        }

        const validPassword = await bcrypt.compare(password, customer.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = generateCustomerToken(customer);

        res.json({
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                street: customer.street,
                colony: customer.colony,
                city: customer.city,
                state: customer.state,
                zip_code: customer.zip_code,
                address_references: customer.address_references
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/customers/me — Get customer profile
router.get('/me', requireCustomerAuth, async (req, res, next) => {
    try {
        const { rows } = await query(
            'SELECT id, name, email, phone, street, colony, city, state, zip_code, address_references, created_at FROM customers WHERE id = $1',
            [req.customer.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ customer: rows[0] });
    } catch (err) {
        next(err);
    }
});

// PUT /api/customers/me — Update customer profile
router.put('/me', requireCustomerAuth, async (req, res, next) => {
    try {
        const { name, phone, street, colony, city, state, zip_code, address_references } = req.body;

        // Validate phone if provided
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({ error: 'El teléfono debe tener exactamente 10 dígitos' });
        }

        const { rows } = await query(
            `UPDATE customers 
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 street = COALESCE($3, street),
                 colony = COALESCE($4, colony),
                 city = COALESCE($5, city),
                 state = COALESCE($6, state),
                 zip_code = COALESCE($7, zip_code),
                 address_references = COALESCE($8, address_references)
             WHERE id = $9
             RETURNING id, name, email, phone, street, colony, city, state, zip_code, address_references`,
            [name || null, phone || null, street || null, colony || null, city || null, state || null, zip_code || null, address_references || null, req.customer.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ customer: rows[0] });
    } catch (err) {
        next(err);
    }
});

// GET /api/customers/me/orders — Get customer's orders with items
router.get('/me/orders', requireCustomerAuth, async (req, res, next) => {
    try {
        const { rows: orders } = await query(`
            SELECT o.id, o.order_number, o.subtotal, o.shipping_cost, o.discount, o.total,
                   o.status, o.payment_method, o.tracking_number, o.notes,
                   o.shipped_at, o.delivered_at, o.created_at, o.updated_at
            FROM orders o
            WHERE o.customer_id = $1
            ORDER BY o.created_at DESC
        `, [req.customer.id]);

        // Fetch items for each order
        for (const order of orders) {
            const { rows: items } = await query(`
                SELECT product_name, product_sku, selected_options, quantity, unit_price, subtotal
                FROM order_items
                WHERE order_id = $1
            `, [order.id]);
            order.items = items;
        }

        res.json({ orders });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
