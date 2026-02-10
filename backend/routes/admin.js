/**
 * Admin Auth API Routes — Direct PostgreSQL
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, requireAuth } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const { rows } = await query(
            'SELECT * FROM admins WHERE username = $1 AND is_active = true',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const admin = rows[0];

        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Update last login
        await query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

        // Generate JWT
        const token = generateToken(admin);

        // Save session
        await query(`
      INSERT INTO admin_sessions (admin_id, token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [admin.id, token, req.ip || '', req.headers['user-agent'] || '',
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);

        res.json({
            token,
            admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/admin/logout
router.post('/logout', requireAuth, async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        await query('DELETE FROM admin_sessions WHERE token = $1', [token]);
        res.json({ message: 'Sesión cerrada correctamente' });
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/me
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await query(
            'SELECT id, username, email, role, last_login, created_at FROM admins WHERE id = $1',
            [req.admin.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Admin no encontrado' });
        }

        res.json({ admin: rows[0] });
    } catch (err) {
        next(err);
    }
});

// PUT /api/admin/password
router.put('/password', requireAuth, async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        const { rows } = await query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
        const admin = rows[0];

        const validPassword = await bcrypt.compare(current_password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const salt = await bcrypt.genSalt(12);
        const newHash = await bcrypt.hash(new_password, salt);

        await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, req.admin.id]);

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
