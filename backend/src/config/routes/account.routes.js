// backend/src/config/routes/account.routes.js

const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { createAccount } = require('../controllers/account.controller'); 

const router = express.Router();

// Protected Route: POST /api/v1/accounts
router.post('/', protect, createAccount);

module.exports = router;