// backend/src/config/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret'); 
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Not authorized, token failed' });
    }
};