const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.JWT_SECRET;
const BlacklistedToken = require('../model/BlacklistedToken');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                message: 'Not authenticated: Missing Authorization header'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Not authenticated: Token missing'
            });
        }

        // 🔹 Check if token is blacklisted
        const isBlacklisted = await BlacklistedToken.findOne({
            token
        });
        if (isBlacklisted) {
            return res.status(401).json({
                message: 'Token has been logged out. Please log in again.'
            });
        }

        // 🔹 Verify token
        const decodedToken = jwt.verify(token, jwtSecretKey);
        if (!decodedToken) {
            return res.status(401).json({
                message: 'Not authenticated: Invalid token'
            });
        }

        req.userId = decodedToken.userId;
        req.user = decodedToken;

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expired. Please log in again.'
            });
        }
        console.error('Auth middleware error:', err.message);
        res.status(500).json({
            message: 'Server authentication error'
        });
    }
};