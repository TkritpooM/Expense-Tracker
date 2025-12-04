// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// **หมายเหตุ: API_BASE_URL ต้องตรงกับที่ตั้งค่าใน Backend (.env)**
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const authApi = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/auth`, // ชี้ไปที่ Auth Routes
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { user_id, username }
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 1. ตรวจสอบสถานะเมื่อโหลดครั้งแรก
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    // 2. ฟังก์ชัน Login
    const login = async (username, password) => {
        try {
            const response = await authApi.post('/login', { username, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            navigate('/dashboard'); 
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.error || 'Login failed' };
        }
    };

    // 3. ฟังก์ชัน Logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);