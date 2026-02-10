/**
 * Auth Middleware — Verifies JWT tokens for admin routes
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kingice-dev-secret-change-me';

/**
 * Generate a JWT token for an admin user
 */
function generateToken(admin) {
    return jwt.sign(
        {
            id: admin.id,
            username: admin.username,
            role: admin.role
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

/**
 * Middleware: Require authentication
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado, inicia sesión de nuevo' });
        }
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * Middleware: Require specific role
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }
        next();
    };
}

module.exports = { generateToken, requireAuth, requireRole };
