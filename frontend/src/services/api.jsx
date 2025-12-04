// frontend/src/services/api.jsx (อัปเดต)

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// สร้าง Axios Instance หลัก (ใช้สำหรับ Protected Routes)
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// **สำคัญ: เพิ่ม Interceptor เพื่อใส่ Token ใน Header ก่อน Request**
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// ************************************************************
// API: Dashboard and Master Data
// ************************************************************

export const getDashboardData = async (page = 1, limit = 5) => {
  // ไม่ต้องใช้ userId ใน Route แล้ว เพราะ Backend ดึงจาก Token
  const response = await api.get(`/transactions/dashboard?page=${page}&limit=${limit}`); // เพิ่ม Pagination Query
  return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/transactions/categories');
    return response.data;
};

// ************************************************************
// API: Transactions
// ************************************************************

export const recordTransaction = async (type, data) => {
    const response = await api.post(`/transactions/${type}`, data);
    return response.data;
};

// ฟังก์ชันสำหรับรัน Script ทดสอบ (ยังคงอยู่ แต่ควรใช้ผ่าน API Instance)
export const setupTestData = async () => {
  const response = await api.get('/transactions/setup-test-data');
  return response.data;
};

export const createAccount = async (accountData) => {
    // ใช้ api instance ที่มี Interceptor (Token) อยู่แล้ว
    const response = await api.post('/accounts', accountData);
    return response.data;
};

export const checkAccountStatus = async () => {
    const response = await api.get('/transactions/has-accounts');
    return response.data;
};
