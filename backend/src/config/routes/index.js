// backend/src/config/routes/index.js (รวบรวม Routes ทั้งหมด)

const express = require('express');
const authRoutes = require('./auth.routes');
const transactionRoutes = require('./transaction.routes');
const accountRoutes = require('./account.routes');

const router = express.Router();

// Public Routes (ไม่ต้องมี Token)
router.use('/auth', authRoutes);

// Protected Routes (ต้องมี Token)
router.use('/transactions', transactionRoutes);
router.use('/accounts', accountRoutes);

module.exports = router;