// frontend/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const authApi = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/auth`, // ชี้ไปที่ Auth Routes
});

const RegisterPage = () => {
    const [formState, setFormState] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // เรียก API สมัครสมาชิก
            const response = await authApi.post('/register', formState);
            
            setSuccess('Registration successful! Redirecting to login...');
            
            // นำทางไปหน้า Login หลังสมัครสมาชิกสำเร็จ
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Registration failed.';
            
            // จัดการ Error จาก Zod Validation (ถ้ามี)
            if (err.response?.data?.details) {
                const details = err.response.data.details.map(d => `${d.path[0]}: ${d.message}`).join(', ');
                setError(`Validation Error: ${details}`);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Register Account</h2>
                <form onSubmit={handleSubmit}>
                    {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                    
                    {/* Username Field */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="flex flex-col items-center justify-between">
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Register'}
                        </button>
                        
                        <Link to="/login" className="inline-block align-baseline font-bold text-sm text-indigo-500 hover:text-indigo-800 mt-4">
                            Already have an account? Login here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;