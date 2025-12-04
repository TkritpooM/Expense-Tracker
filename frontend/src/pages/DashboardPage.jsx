// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { getDashboardData, checkAccountStatus } from '../services/api.jsx';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm.jsx'; // <--- Form Component

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = async (page = currentPage) => {
        if (!user || !user.user_id) return;
        setLoading(true);
        setError(null);
        try {
            // **ขั้นตอนที่ 1: ตรวจสอบว่ามีบัญชีแล้วหรือยัง**
            const status = await checkAccountStatus();
            if (!status.hasAccounts) {
                // ถ้าไม่มีบัญชี ให้ Redirect ทันที
                navigate('/create-account'); 
                return; 
            }

            // ดึงข้อมูล Dashboard ของผู้ใช้ที่ Login (Backend จะใช้ Token)
            const dashboardData = await getDashboardData(page, 5); // ดึง 5 รายการต่อหน้า
            setData(dashboardData);
            setPagination(dashboardData.pagination);
            setCurrentPage(dashboardData.pagination.current_page);
        } catch (error) {
            setError('Failed to fetch dashboard data. Please log in again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // เมื่อ Login สำเร็จ ให้ดึงข้อมูลหน้าแรก
        fetchData();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-xl">Loading Dashboard...</div>;
    if (error || !data) return <div className="p-8 text-center text-xl text-red-500">{error || 'No data available. Please check server.'}</div>;
    
    // Component TransactionForm จะถูกวางไว้ที่นี่
    // Logic การแสดงผล (JSX) จะรวมอยู่ใน return statement

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-indigo-800">
                    💰 {data.user.username}'s Dashboard
                </h1>
                <div className="flex space-x-3"> {/* <--- เพิ่ม div สำหรับจัดกลุ่มปุ่ม */}
                    {/* ปุ่มเพิ่มบัญชี */}
                    <button
                        onClick={() => navigate('/create-account')} // <--- ใช้ navigate ไปที่หน้าสร้างบัญชี
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    >
                        + Add Account
                    </button>
                    {/* ปุ่ม Logout เดิม */}
                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Logout
                    </button>
                </div>
            </header>
            
            {/* Transaction Form */}
            <TransactionForm onTransactionAdded={() => fetchData(currentPage)} /> 
            
            {/* Summary Section */}
            {/* ... (Account Cards เหมือนเดิม) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {data.accounts.map(account => (
                    <div key={account.account_name} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
                        <p className="text-lg font-semibold text-gray-600">{account.account_name}</p>
                        <p className="text-3xl font-bold text-gray-800 mt-1">
                            {parseFloat(account.current_balance).toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 })}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent Transactions Table */}
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Recent Transactions</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                {/* ตารางแสดงรายการธุรกรรม */}
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.transactions.map((tx, index) => (
                          <tr key={index} className={tx.transaction_type === 'Income' ? 'bg-green-50' : tx.transaction_type === 'Transfer_Out' ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.transaction_type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {tx.transaction_type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.category?.category_name || 'N/A'}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.transaction_type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.account.account_name}</td>
                          </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center mt-4 space-x-2">
                <button
                    onClick={() => fetchData(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="px-3 py-1">Page {currentPage} of {pagination.total_pages}</span>
                <button
                    onClick={() => fetchData(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages}
                    className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default DashboardPage;