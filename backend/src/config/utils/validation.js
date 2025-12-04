// backend/src/config/utils/validation.js

const { z } = require('zod');

exports.registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

exports.loginSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
});

exports.transactionSchema = z.object({
    amount: z.number().positive("Amount must be a positive number"), 
    account_id: z.number().int().positive("Account ID must be a positive integer"),
    category_id: z.number().int().positive().optional(),
    description: z.string().max(255).optional(),
    to_account_id: z.number().int().positive().optional(), 
});

exports.transactionExpenseSchema = z.object({
    account_id: z.number().int().positive("Account ID must be a positive integer"),
    category_id: z.number().int().positive("Category ID is required for expense"),
    amount: z.number().positive("Amount must be a positive number"),
    description: z.string().max(255).optional(),
});

exports.accountSchema = z.object({
    account_name: z.string().min(1, "Account name is required."),
    // ต้องตรงกับ ENUM ใน DB: ENUM('Cash', 'Bank', 'Credit Card', 'E-Wallet', 'Other')
    account_type: z.enum(['Cash', 'Bank', 'Credit_Card', 'E_Wallet', 'Other']),
    // ยอดคงเหลือเริ่มต้นต้องเป็นตัวเลข >= 0
    initial_balance: z.number().min(0, "Initial balance cannot be negative."),
});