// backend/src/config/controllers/auth.controller.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../utils/validation');

const prisma = new PrismaClient();

const generateToken = (user_id) => {
    return jwt.sign({ id: user_id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d', 
    });
};

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = registerSchema.parse(req.body);
        const existingUser = await prisma.users.findUnique({ where: { username } });
        if (existingUser) return res.status(400).json({ error: 'Username already exists.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await prisma.users.create({
            data: { username, email, password_hash },
            select: { user_id: true, username: true, email: true },
        });

        const token = generateToken(newUser.user_id);
        res.status(201).json({ user: newUser, token });

    } catch (error) {
        if (error.issues) return res.status(400).json({ error: 'Validation failed', details: error.issues });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);

        const user = await prisma.users.findUnique({ where: { username } });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

        const token = generateToken(user.user_id);

        res.json({
            user: { user_id: user.user_id, username: user.username },
            token,
        });

    } catch (error) {
        if (error.issues) return res.status(400).json({ error: 'Validation failed', details: error.issues });
        res.status(500).json({ error: 'Server error' });
    }
};