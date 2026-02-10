/**
 * Dashboard API Routes — Direct PostgreSQL
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', requireAuth, async (req, res, next) => {
    try {
        // All stats in parallel
        const [ordersRes, revenueRes, productsRes, customersRes, categoriesRes] = await Promise.all([
            query(`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`),
            query(`SELECT COALESCE(SUM(total), 0)::numeric AS revenue FROM orders WHERE status IN ('confirmed', 'shipped', 'delivered', 'paid')`),
            query(`SELECT COUNT(*)::int AS count FROM products WHERE active = true`),
            query(`SELECT COUNT(*)::int AS count FROM customers`),
            query(`SELECT COUNT(*)::int AS count FROM categories WHERE active = true`)
        ]);

        const ordersByStatus = {
            sent_to_whatsapp: 0,
            confirmed: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };

        let totalOrders = 0;

        ordersRes.rows.forEach(r => {
            // Map legacy 'pending' or 'paid' to new structure if needed, or just display raw
            if (ordersByStatus.hasOwnProperty(r.status)) {
                ordersByStatus[r.status] = r.count;
            } else if (r.status === 'pending') {
                ordersByStatus.sent_to_whatsapp += r.count; // Treat pending as sent_to_whatsapp
            } else {
                // Keep other statuses if they exist
                ordersByStatus[r.status] = r.count;
            }
            totalOrders += r.count;
        });

        res.json({
            stats: {
                totalOrders,
                ordersByStatus,
                totalRevenue: parseFloat(revenueRes.rows[0].revenue),
                totalProducts: productsRes.rows[0].count,
                totalCustomers: customersRes.rows[0].count,
                totalCategories: categoriesRes.rows[0].count
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/dashboard/recent
router.get('/recent', requireAuth, async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const { rows } = await query(`
      SELECT o.id, o.order_number, o.total, o.status, o.created_at, o.source, o.last_status_changed_at,
        json_build_object('name', cu.name, 'email', cu.email) AS customer
      FROM orders o
      JOIN customers cu ON o.customer_id = cu.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

        res.json({ orders: rows });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

