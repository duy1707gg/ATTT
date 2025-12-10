import React, { useState, useEffect } from "react";
import UserService from "../services/user.service";
import AuditLog from "./AuditLog";

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        UserService.getAllUsers().then(
            (response) => {
                setUsers(response.data);
            },
            (error) => {
                const _content =
                    (error.response && error.response.data && error.response.data.message) ||
                    error.message ||
                    error.toString();
                setMessage(_content);
            }
        );
    };

    const toggleUserStatus = (userId, currentStatus) => {
        UserService.updateUserStatus(userId, !currentStatus).then(
            (response) => {
                setMessage(response.data);
                loadUsers();
            },
            (error) => {
                setMessage("Lỗi cập nhật trạng thái người dùng");
            }
        );
    };

    return (
        <>
            <div className="bg-white rounded-2xl shadow-card p-6 mb-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Bảng điều khiển Admin - Quản lý người dùng
                    </h3>
                </div>

                {message && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {message}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase text-gray-500 bg-gray-50 rounded-lg">
                            <tr>
                                <th className="py-4 px-4 rounded-l-lg font-semibold">ID</th>
                                <th className="py-4 px-4 font-semibold">Tên đăng nhập</th>
                                <th className="py-4 px-4 font-semibold">Email</th>
                                <th className="py-4 px-4 font-semibold">Vai trò</th>
                                <th className="py-4 px-4 font-semibold">Trạng thái</th>
                                <th className="py-4 px-4 rounded-r-lg font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="py-4 px-4 text-gray-500">{user.id}</td>
                                    <td className="py-4 px-4 font-medium text-gray-900">{user.username}</td>
                                    <td className="py-4 px-4 text-gray-500">{user.email}</td>
                                    <td className="py-4 px-4">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.enabled
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                            }`}>
                                            {user.enabled ? "Hoạt động" : "Vô hiệu hóa"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <button
                                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-lg ${user.enabled
                                                ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-red-200"
                                                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200"
                                                }`}
                                            onClick={() => toggleUserStatus(user.id, user.enabled)}
                                        >
                                            {user.enabled ? "Vô hiệu hóa" : "Kích hoạt"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AuditLog />
        </>
    );
};

export default AdminDashboard;
