import React, { useState, useEffect } from "react";
import UserService from "../services/user.service";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const { register, handleSubmit, reset } = useForm();
    const [showAddForm, setShowAddForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        UserService.getAllUsers().then(
            (response) => {
                setUsers(response.data);
            },
            (error) => {
                console.error("Error loading users", error);
                setMessage("Không thể tải danh sách người dùng.");
            }
        );
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa user này?")) {
            UserService.deleteUser(id).then(
                () => {
                    setMessage("Đã xóa thành công!");
                    loadUsers();
                },
                (error) => {
                    setMessage("Lỗi khi xóa: " + error.toString());
                }
            );
        }
    };

    const onSubmitAdd = (data) => {
        UserService.createUser({ ...data, role: ["staff"] }).then(
            () => {
                setMessage("Tạo user thành công!");
                setShowAddForm(false);
                reset();
                loadUsers();
            },
            (error) => {
                setMessage("Lỗi tạo user: " + (error.response?.data?.message || error.message));
            }
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                SecureVault
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-all duration-200"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => navigate("/admin/users")}
                                className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 font-medium transition-all duration-200"
                            >
                                Quản lý User
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h2>
                            <p className="text-gray-500">Quản lý tất cả người dùng trong hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${showAddForm
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-gray-200"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200"}`}
                    >
                        {showAddForm ? "Hủy Thêm Mới" : "+ Thêm Người Dùng Mới"}
                    </button>
                </div>

                {message && (
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-6 flex items-center gap-3 border border-blue-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {message}
                    </div>
                )}

                {/* Add User Form */}
                {showAddForm && (
                    <div className="bg-white p-8 rounded-2xl mb-8 shadow-card border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Thêm User Mới</h3>
                        </div>
                        <form onSubmit={handleSubmit(onSubmitAdd)} className="grid grid-cols-2 gap-4">
                            <input
                                {...register("username", { required: true })}
                                placeholder="Username"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            />
                            <input
                                {...register("email", { required: true })}
                                placeholder="Email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            />
                            <input
                                {...register("password", { required: true })}
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            />
                            <input
                                {...register("fullName", { required: true })}
                                placeholder="Họ tên"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            />
                            <input
                                {...register("phoneNumber", { required: true })}
                                placeholder="SĐT"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            />
                            <input
                                {...register("nationalId", { required: true })}
                                placeholder="CCCD"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            />
                            <div className="col-span-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200"
                                >
                                    Tạo User
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-500">{user.id}</td>
                                    <td className="p-4 font-medium text-gray-900">{user.username}</td>
                                    <td className="p-4 text-gray-500">{user.email}</td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-red-200"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
