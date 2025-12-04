// backend/src/config/index.js

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Imports: Routes
const allRoutes = require('./routes/index');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 4000; 

// Middleware
app.use(cors());
app.use(express.json());

// Routes หลัก (รวมทุก Routes ไว้ภายใต้ /api/v1)
app.use('/api/v1', allRoutes);

// Database connection & Start Server
async function startServer() {
    try {
        await prisma.$connect(); 
        console.log('✅ Prisma Client connected to MySQL.');

        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`Try POST http://localhost:${port}/api/v1/auth/register`);
        });

    } catch (e) {
        console.error('❌ Could not connect to database or start server:', e);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();