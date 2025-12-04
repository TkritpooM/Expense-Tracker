// backend/src/config/controllers/transaction.controller.js (โค้ดฉบับสมบูรณ์)

const { PrismaClient } = require('@prisma/client');
// ต้องมีการนำเข้า Schema ที่ใช้สำหรับ Zod Validation ทั้งหมด
const { transactionSchema, transactionExpenseSchema } = require('../utils/validation'); 

const prisma = new PrismaClient();

// ************************************************************
// API: GET /transactions/dashboard
// ************************************************************
exports.getDashboardData = async (req, res) => {
    // ID ผู้ใช้ถูกดึงมาจาก JWT Token ที่ตรวจสอบแล้ว
    const userId = req.user.id; 
    const { page = 1, limit = 10 } = req.query; // Pagination

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    try {
        const user = await prisma.users.findUnique({ where: { user_id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // 1. ดึงบัญชี
        const accounts = await prisma.accounts.findMany({ where: { user_id: userId } });

        // 2. ดึงรายการธุรกรรมพร้อม Pagination
        const transactions = await prisma.transactions.findMany({
            where: { user_id: userId },
            orderBy: { transaction_date: 'desc' },
            skip: offset,
            take: limitNum,
            select: {
                transaction_date: true,
                transaction_type: true,
                amount: true,
                description: true,
                account: { select: { account_name: true } },
                to_account: { select: { account_name: true } },
                category: { select: { category_name: true } }
            }
        });

        // 3. นับจำนวนรวมทั้งหมดสำหรับ Pagination
        const totalTransactions = await prisma.transactions.count({ where: { user_id: userId } });
        const totalPages = Math.ceil(totalTransactions / limitNum);

        res.json({
            user: { username: user.username, user_id: user.user_id },
            accounts,
            transactions,
            pagination: {
                total_items: totalTransactions,
                total_pages: totalPages,
                current_page: parseInt(page),
                limit: limitNum
            }
        });

    } catch (e) {
        console.error('Error fetching dashboard data:', e);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
};

// ************************************************************
// API: GET /transactions/categories (Master Data)
// ************************************************************
exports.getCategories = async (req, res) => {
    try {
        const categories = await prisma.categories.findMany({
            orderBy: { category_type: 'asc' } 
        });
        res.json(categories);
    } catch (e) {
        console.error("Error fetching categories:", e);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// ************************************************************
// API: POST /transactions/expense (บันทึกรายจ่าย)
// ************************************************************
exports.recordExpense = async (req, res) => {
    const userId = req.user.id;
    try {
        // Zod Validation สำหรับรายจ่าย (ใช้ transactionExpenseSchema)
        const { account_id, category_id, amount, description } = transactionExpenseSchema.parse(req.body);
        
        await prisma.$transaction([
            // 1. บันทึกรายการธุรกรรม (Expense)
            prisma.transactions.create({
                data: {
                    user_id: userId,
                    account_id: account_id,
                    category_id: category_id,
                    transaction_date: new Date(),
                    transaction_type: 'Expense',
                    amount: amount,
                    description: description,
                },
            }),
            // 2. อัปเดตยอดคงเหลือในบัญชี (ลด)
            prisma.accounts.update({
                where: { account_id: account_id },
                data: {
                    current_balance: { decrement: amount },
                },
            }),
        ]);

        res.status(201).json({ message: 'Expense transaction recorded successfully.' });
    } catch (e) {
        if (e.issues) return res.status(400).json({ error: 'Validation failed', details: e.issues });
        console.error('Error recording expense:', e);
        res.status(500).json({ error: 'Database transaction failed.' });
    }
};

// ************************************************************
// API: POST /transactions/income (บันทึกรายรับ)
// ************************************************************
exports.recordIncome = async (req, res) => {
    const userId = req.user.id;
    try {
        // Zod Validation สำหรับรายรับ (ใช้ transactionExpenseSchema)
        const { account_id, category_id, amount, description } = transactionExpenseSchema.parse(req.body);
        
        await prisma.$transaction([
            // 1. บันทึกรายการธุรกรรม (Income)
            prisma.transactions.create({
                data: {
                    user_id: userId,
                    account_id: account_id,
                    category_id: category_id,
                    transaction_date: new Date(),
                    transaction_type: 'Income',
                    amount: amount,
                    description: description,
                },
            }),
            // 2. อัปเดตยอดคงเหลือในบัญชี (เพิ่ม)
            prisma.accounts.update({
                where: { account_id: account_id },
                data: {
                    current_balance: { increment: amount },
                },
            }),
        ]);

        res.status(201).json({ message: 'Income transaction recorded successfully.' });
    } catch (e) {
        if (e.issues) return res.status(400).json({ error: 'Validation failed', details: e.issues });
        console.error('Error recording income:', e);
        res.status(500).json({ error: 'Database transaction failed.' });
    }
};

// ************************************************************
// API: POST /transactions/transfer (บันทึกการโอนเงิน)
// ************************************************************
exports.recordTransfer = async (req, res) => {
    const userId = req.user.id;
    try {
        // Zod Validation สำหรับการโอน (ใช้ transactionSchema)
        const { account_id, amount, to_account_id, description } = transactionSchema.parse(req.body); 
        
        if (account_id === to_account_id) {
            return res.status(400).json({ error: 'Cannot transfer to the same account.' });
        }
        
        await prisma.$transaction([
            // 1. บันทึกรายการโอนออก (Transfer_Out)
            prisma.transactions.create({
                data: {
                    user_id: userId,
                    account_id: account_id, // บัญชีต้นทาง
                    // สำหรับ Transfer เราใช้ category_id เป็นค่าคงที่หรือค่าที่กำหนดไว้ใน DB
                    category_id: 1, // *ควรใช้ Category ID ที่เหมาะสมสำหรับ Transfer*
                    transaction_date: new Date(),
                    transaction_type: 'Transfer_Out',
                    amount: amount,
                    description: description || 'Fund Transfer',
                    to_account_id: to_account_id,
                },
            }),
            // 2. อัปเดตยอดคงเหลือในบัญชีต้นทาง (ลด)
            prisma.accounts.update({
                where: { account_id: account_id },
                data: {
                    current_balance: { decrement: amount },
                },
            }),
            // 3. อัปเดตยอดคงเหลือในบัญชีปลายทาง (เพิ่ม)
            prisma.accounts.update({
                where: { account_id: to_account_id },
                data: {
                    current_balance: { increment: amount },
                },
            }),
        ]);

        res.status(201).json({ message: 'Funds transferred successfully.' });
    } catch (e) {
        if (e.issues) return res.status(400).json({ error: 'Validation failed', details: e.issues });
        console.error('Error recording transfer:', e); 
        res.status(500).json({ error: 'Database transaction failed.' });
    }
};

exports.checkUserAccounts = async (req, res) => {
    const userId = req.user.id;
    try {
        const accountCount = await prisma.accounts.count({
            where: { user_id: userId }
        });

        res.json({ 
            hasAccounts: accountCount > 0,
            count: accountCount
        });

    } catch (e) {
        console.error('Error checking accounts:', e);
        res.status(500).json({ error: 'Failed to check account status.' });
    }
};