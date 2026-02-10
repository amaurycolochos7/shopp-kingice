/**
 * Products API Routes — Direct PostgreSQL
 */
const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/products — List all active products
router.get('/', async (req, res, next) => {
    try {
        const { category, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let paramIndex = 1;

        let sql = `
      SELECT p.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (SELECT json_agg(pi ORDER BY pi.display_order)
           FROM product_images pi WHERE pi.product_id = p.id), '[]'
        ) AS images,
        COALESCE(
          (SELECT json_agg(po ORDER BY po.display_order)
           FROM product_options po WHERE po.product_id = p.id), '[]'
        ) AS options
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
    `;

        if (category) {
            sql += ` AND c.slug = $${paramIndex++}`;
            params.push(category);
        }

        if (search) {
            sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Count query
        const countSql = sql.replace(/SELECT p\.\*[\s\S]*?FROM products p/, 'SELECT COUNT(*) FROM products p');
        const { rows: countRows } = await query(countSql, params);
        const total = parseInt(countRows[0].count);

        sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const { rows } = await query(sql, params);

        res.json({
            products: rows,
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

// GET /api/products/featured — Featured products
router.get('/featured', async (req, res, next) => {
    try {
        const { limit = 8 } = req.query;

        const { rows } = await query(`
      SELECT p.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (SELECT json_agg(pi ORDER BY pi.display_order)
           FROM product_images pi WHERE pi.product_id = p.id), '[]'
        ) AS images
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.active = true AND p.featured = true
      ORDER BY p.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

        res.json({ products: rows });
    } catch (err) {
        next(err);
    }
});

// GET /api/products/:id — Get single product
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { rows } = await query(`
      SELECT p.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (SELECT json_agg(pi ORDER BY pi.display_order)
           FROM product_images pi WHERE pi.product_id = p.id), '[]'
        ) AS images,
        COALESCE(
          (SELECT json_agg(po ORDER BY po.display_order)
           FROM product_options po WHERE po.product_id = p.id), '[]'
        ) AS options
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ product: rows[0] });
    } catch (err) {
        next(err);
    }
});

// POST /api/products — Create product (admin only)
router.post('/', requireAuth, requireRole('superadmin', 'admin'), async (req, res, next) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const { name, slug, description, base_price, category_id, sku, active, featured, meta_title, meta_description, images, options } = req.body;

        const { rows } = await client.query(`
      INSERT INTO products (name, slug, description, base_price, category_id, sku, active, featured, meta_title, meta_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, slug, description, base_price, category_id, sku, active !== false, featured || false, meta_title, meta_description]);

        const product = rows[0];

        // Add images
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await client.query(`
          INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
          VALUES ($1, $2, $3, $4, $5)
        `, [product.id, images[i].url, images[i].alt || name, i, i === 0]);
            }
        }

        // Add options
        if (options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await client.query(`
          INSERT INTO product_options (product_id, option_name, option_values, display_order, required)
          VALUES ($1, $2, $3, $4, $5)
        `, [product.id, options[i].name, JSON.stringify(options[i].values), i, options[i].required !== false]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ product });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// PUT /api/products/:id — Update product (admin only)
router.put('/:id', requireAuth, requireRole('superadmin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, base_price, category_id, sku, active, featured, meta_title, meta_description } = req.body;

        const { rows } = await query(`
      UPDATE products
      SET name=$1, slug=$2, description=$3, base_price=$4, category_id=$5,
          sku=$6, active=$7, featured=$8, meta_title=$9, meta_description=$10
      WHERE id=$11
      RETURNING *
    `, [name, slug, description, base_price, category_id, sku, active, featured, meta_title, meta_description, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ product: rows[0] });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/products/:id — Delete product (admin only)
router.delete('/:id', requireAuth, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
