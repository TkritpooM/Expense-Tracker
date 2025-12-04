// backend/src/config/routes/transaction.routes.js

const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getDashboardData, recordExpense, recordIncome, recordTransfer, getCategories, checkUserAccounts } = require('../controllers/transaction.controller'); 

const router = express.Router();

// Public Data for Dropdowns (GET /api/v1/transactions/categories)
router.get('/categories', getCategories); // <--- Route ที่หายไป

// Routes ที่ต้องมี JWT Token
router.get('/dashboard', protect, getDashboardData);
router.get('/has-accounts', protect, checkUserAccounts);
router.post('/expense', protect, recordExpense); 
router.post('/income', protect, recordIncome);
router.post('/transfer', protect, recordTransfer);

module.exports = router;