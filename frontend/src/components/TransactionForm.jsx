// frontend/src/components/TransactionForm.jsx

import React, { useState, useEffect } from 'react';
import { recordTransaction, getCategories, getDashboardData } from '../services/api.jsx';
import { useAuth } from '../contexts/AuthContext';

const TransactionForm = ({ onTransactionAdded }) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [transactionType, setTransactionType] = useState('expense');
    const [formState, setFormState] = useState({
        amount: '',
        description: '',
        accountId: '',
        categoryId: '',
        toAccountId: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. ดึงข้อมูลบัญชีและหมวดหมู่เมื่อ Component โหลด
    useEffect(() => {
        const loadMasterData = async () => {
            if (!user) return;
            try {
                // ดึงข้อมูลบัญชี (Accounts) จาก Dashboard API (เพื่อไม่ให้เรียก API ซ้ำ)
                // เนื่องจาก Dashboard API ดึง accounts มาด้วย เราใช้ประโยชน์จากมัน
                const dashboardData = await getDashboardData(); 
                setAccounts(dashboardData.accounts);
                
                // ดึงข้อมูลหมวดหมู่ (Categories)
                const categoryData = await getCategories();
                setCategories(categoryData);

                // ตั้งค่าเริ่มต้นบัญชี (ใช้บัญชีแรกเป็นค่าเริ่มต้น)
                if (dashboardData.accounts.length > 0) {
                    setFormState(prev => ({ 
                        ...prev, 
                        accountId: dashboardData.accounts[0].account_id,
                        // ตั้งค่า Category ID เริ่มต้นสำหรับ Expense ถ้ามี
                        categoryId: categoryData.find(c => c.category_type === 'Expense')?.category_id || '' 
                    }));
                }
            } catch (e) {
                setError('Failed to load required data. (Accounts/Categories)');
                console.error(e);
            }
        };
        loadMasterData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type) => {
        setTransactionType(type);
        setError(null);
        // รีเซ็ต categoryId เมื่อเปลี่ยนประเภท
        setFormState(prev => ({ 
            ...prev, 
            categoryId: '',
            toAccountId: '',
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            // เตรียมข้อมูลที่จะส่ง (แปลง string เป็นตัวเลขตามที่ Zod/Backend ต้องการ)
            const dataToSend = {
                amount: parseFloat(formState.amount),
                account_id: parseInt(formState.accountId),
                description: formState.description,
            };

            // ตรวจสอบเงื่อนไขเฉพาะของแต่ละประเภท
            if (transactionType === 'transfer') {
                dataToSend.to_account_id = parseInt(formState.toAccountId);
            } else { // income หรือ expense
                dataToSend.category_id = parseInt(formState.categoryId);
            }
            
            // เรียก API บันทึกรายการ
            await recordTransaction(transactionType, dataToSend);
            
            // 1. อัปเดต Dashboard (เรียกฟังก์ชันที่ส่งมาจาก DashboardPage)
            onTransactionAdded(); 
            
            // 2. ล้างฟอร์ม
            setFormState(prev => ({ 
                ...prev, 
                amount: '', 
                description: '', 
                toAccountId: '' 
            }));
            
            alert(`Transaction (${transactionType}) recorded successfully!`);

        } catch (e) {
            console.error('API Error:', e.response?.data);
            setError(e.response?.data?.error || 'An error occurred while saving the transaction.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Record New Transaction</h2>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            {/* Transaction Type Selector */}
            <div className="flex space-x-4 mb-6">
                {['expense', 'income', 'transfer'].map(type => (
                    <button
                        key={type}
                        onClick={() => handleTypeChange(type)}
                        className={`py-2 px-4 rounded font-medium transition-colors ${
                            transactionType === type
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        disabled={loading}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Amount */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Amount (THB)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="amount"
                            value={formState.amount}
                            onChange={handleChange}
                            required
                            className="w-full border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Account From/To */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Account {transactionType === 'income' ? 'To' : 'From'}</label>
                        <select
                            name="accountId"
                            value={formState.accountId}
                            onChange={handleChange}
                            required
                            className="w-full border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                        >
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.account_id} value={acc.account_id}>
                                    {acc.account_name} ({parseFloat(acc.current_balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category (สำหรับ Income/Expense) */}
                    {(transactionType === 'expense' || transactionType === 'income') && (
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Category</label>
                            <select
                                name="categoryId"
                                value={formState.categoryId}
                                onChange={handleChange}
                                required
                                className="w-full border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                <option value="">Select Category</option>
                                {categories
                                    .filter(c => c.category_type === transactionType.charAt(0).toUpperCase() + transactionType.slice(1))
                                    .map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Account To (สำหรับ Transfer) */}
                    {transactionType === 'transfer' && (
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Account To</label>
                            <select
                                name="toAccountId"
                                value={formState.toAccountId}
                                onChange={handleChange}
                                required
                                className="w-full border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                <option value="">Select Target Account</option>
                                {accounts
                                    .filter(acc => acc.account_id !== parseInt(formState.accountId)) // ไม่ให้โอนเข้าบัญชีตัวเอง
                                    .map(acc => (
                                        <option key={acc.account_id} value={acc.account_id}>
                                            {acc.account_name} ({parseFloat(acc.current_balance).toLocaleString('th-TH', { minimumFractionDigits: 2 })})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="mt-4">
                    <label className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
                    <input
                        type="text"
                        name="description"
                        value={formState.description}
                        onChange={handleChange}
                        className="w-full border rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : `Record ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;