// backend/src/config/controllers/account.controller.js (โค้ดที่แก้ไขแล้ว)

const { PrismaClient } = require('@prisma/client');
const { accountSchema } = require('../utils/validation');

const prisma = new PrismaClient();

exports.createAccount = async (req, res) => {
    // ดึง userId จาก JWT Token
    const userId = parseInt(req.user.id);
    
    try {
        console.log('Received Payload:', req.body); // Log Payload ที่รับมา

        // 1. Zod Validation
        const { account_name, account_type, initial_balance } = accountSchema.parse(req.body);

        // 2. ตรวจสอบว่ามีบัญชีชื่อนี้แล้วหรือยัง (สำหรับผู้ใช้คนนี้)
        const existingAccount = await prisma.accounts.findFirst({
            where: { user_id: userId, account_name: account_name }
        });

        if (existingAccount) {
            return res.status(400).json({ error: 'Account with this name already exists for this user.' });
        }

        // 3. สร้างบัญชีใหม่
        const newAccount = await prisma.accounts.create({
            data: {
                user_id: userId,
                account_name,
                account_type,
                initial_balance: initial_balance,
                current_balance: initial_balance, // initial_balance = current_balance เมื่อสร้างใหม่
            },
        });

        res.status(201).json({ 
            message: 'Account created successfully.',
            account: newAccount
        });

    } catch (e) {
        // 1. ตรวจสอบ Zod Validation Error (ถ้า Frontend ส่งค่าผิดพลาดมา)
        if (e.issues) {
            console.error('Zod Validation Failed:', e.issues); 
            return res.status(400).json({ 
                error: 'Validation failed', 
                message: 'Input data is invalid.', 
                details: e.issues 
            });
        }
        
        // 2. ตรวจสอบ Prisma/Database Error
        if (e.code && e.code.startsWith('P')) { 
            console.error('Prisma Error Code:', e.code); // <--- ดูโค้ดนี้!
            console.error('Prisma Full Error:', e);
            return res.status(400).json({ 
                error: 'Database Constraint Error', 
                message: 'Check if Account Type is correct or Account Name is duplicated.' 
            });
        }

        // 3. จัดการ Server/Runtime Error อื่นๆ
        console.error('Unexpected Server Error creating account:', e);
        res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred on the server.' });
    }
};