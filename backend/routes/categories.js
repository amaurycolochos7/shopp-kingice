/**
 * Categories API Routes — Direct PostgreSQL
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/categories — List all active categories
router.get('/', async (req, res, next) => {
    try {
        const { rows } = await query(
            'SELECT * FROM categories WHERE active = true ORDER BY display_order ASC'
        );
        res.json({ categories: rows });
    } catch (err) {
        next(err);
    }
});

// GET /api/categories/:slug — Get category by slug with its products
router.get('/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;

        // Get category
        const { rows: catRows } = await query(
            'SELECT * FROM categories WHERE slug = $1 AND active = true',
            [slug]
        );

        if (catRows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        const category = catRows[0];

        // Get products in this category
        const { rows: products } = await query(`
      SELECT p.*,
        COALESCE(
          (SELECT json_agg(pi ORDER BY pi.display_order)
           FROM product_images pi WHERE pi.product_id = p.id), '[]'
        ) AS images
      FROM products p
      WHERE p.category_id = $1 AND p.active = true
      ORDER BY p.created_at DESC
    `, [category.id]);

        res.json({ category, products });
    } catch (err) {
        next(err);
    }
});

// POST /api/categories — Create category (admin only)
router.post('/', requireAuth, requireRole('superadmin', 'admin'), async (req, res, next) => {
    try {
        const { name, slug, description, image_url, display_order, active } = req.body;

        const { rows } = await query(`
      INSERT INTO categories (name, slug, description, image_url, display_order, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, slug, description, image_url, display_order || 0, active !== false]);

        res.status(201).json({ category: rows[0] });
    } catch (err) {
        next(err);
    }
});

// PUT /api/categories/:id — Update category (admin only)
router.put('/:id', requireAuth, requireRole('superadmin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image_url, display_order, active } = req.body;

        const { rows } = await query(`
      UPDATE categories SET name=$1, slug=$2, description=$3, image_url=$4, display_order=$5, active=$6
      WHERE id=$7 RETURNING *
    `, [name, slug, description, image_url, display_order, active, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ category: rows[0] });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/categories/:id — Delete category (admin only)
router.delete('/:id', requireAuth, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if category has products
        const { rows: countRows } = await query(
            'SELECT COUNT(*) FROM products WHERE category_id = $1', [id]
        );

        if (parseInt(countRows[0].count) > 0) {
            return res.status(400).json({
                error: `No se puede eliminar: la categoría tiene ${countRows[0].count} productos asociados`
            });
        }

        const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
