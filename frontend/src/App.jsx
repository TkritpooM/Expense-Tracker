// frontend/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateAccountPage from './pages/CreateAccountPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LoginPage />} /> {/* หน้าแรกให้ไป Login */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes (ต้อง Login ก่อน) */}
      <Route element={<ProtectedRoute />}>
      
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        {/* <Route index element={<DashboardPage />} /> */}
        
      </Route>

      {/* เพิ่ม Route อื่นๆ เช่น RegisterPage ได้ที่นี่ */}
    </Routes>
  );
}

export default App;