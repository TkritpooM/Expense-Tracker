// frontend/src/pages/CreateAccountPage.jsx (โค้ดที่แก้ไขแล้ว)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAccount } from '../services/api.jsx';
import { useAuth } from '../contexts/AuthContext';

// **แก้ไข:** ใช้ Internal Name สำหรับ Value แต่ใช้ Label สำหรับแสดงผล
const INTERNAL_ACCOUNT_TYPES = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank', label: 'Bank' },
    { value: 'Credit_Card', label: 'Credit Card' }, // Value ที่ Backend/Zod คาดหวัง
    { value: 'E_Wallet', label: 'E-Wallet' },       // Value ที่ Backend/Zod คาดหวัง
    { value: 'Other', label: 'Other' },
];

const CreateAccountPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formState, setFormState] = useState({
        account_name: '',
        account_type: INTERNAL_ACCOUNT_TYPES[0].value, // ใช้ค่าเริ่มต้นที่ถูกต้อง
        initial_balance: 0, 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;
        if (name === 'initial_balance') {
            // ถ้าค่าว่าง ให้ใช้ 0, ถ้าไม่ใช่ ให้แปลงเป็น float
            newValue = value === '' ? 0 : parseFloat(value); 
        }

        setFormState(prev => ({ 
            ...prev, 
            [name]: newValue 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // สร้าง Object ใหม่เพื่อส่ง (มั่นใจว่าเป็น Number และ Internal ENUM Name)
            const dataToSend = {
                account_name: formState.account_name,
                account_type: formState.account_type, // ส่ง Credit_Card หรือ E_Wallet
                // แปลงเป็น Number อีกครั้งเพื่อความชัวร์ 
                initial_balance: parseFloat(formState.initial_balance) || 0,
            };
            
            await createAccount(dataToSend); // ส่ง Object ที่ปรับปรุงแล้ว
            
            setSuccess('Account created! Redirecting to dashboard...');
            
            // นำทางไปหน้า Dashboard
            setTimeout(() => {
                navigate('/dashboard'); 
            }, 1500);

        } catch (e) {
            console.error('Account creation error:', e.response?.data);
            // ดึง Error Message จาก Backend (อาจเป็น Validation failed หรือ Database error)
            const apiError = e.response?.data;
            const errorMessage = apiError?.message || apiError?.error || 'Failed to create account.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8">Loading user data...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Create Your First Account</h2>
                <p className="text-sm text-center text-gray-600 mb-6">Welcome, {user.username}. You must create at least one account to proceed.</p>

                <form onSubmit={handleSubmit}>
                    {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                    {/* Account Name */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Account Name</label>
                        <input type="text" name="account_name" value={formState.account_name} onChange={handleChange} required className="w-full border rounded py-2 px-3" />
                    </div>

                    {/* Account Type */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Account Type</label>
                        <select name="account_type" value={formState.account_type} onChange={handleChange} required className="w-full border rounded py-2 px-3">
                            {INTERNAL_ACCOUNT_TYPES.map(type => ( // <--- ใช้ INTERNAL_ACCOUNT_TYPES
                                <option key={type.value} value={type.value}>{type.label}</option> // <--- ใช้ value/label
                            ))}
                        </select>
                    </div>

                    {/* Initial Balance */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2">Initial Balance</label>
                        <input type="number" step="0.01" name="initial_balance" value={formState.initial_balance} onChange={handleChange} required className="w-full border rounded py-2 px-3" />
                    </div>

                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateAccountPage;