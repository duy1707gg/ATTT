import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            // Fetch latest profile data from API
            UserService.getProfile().then(
                (response) => {
                    const profile = response.data;
                    setValue("fullName", profile.fullName || profile.username);
                    setValue("phoneNumber", profile.phoneNumber || "");
                    setValue("nationalId", profile.nationalId || "");
                },
                (error) => {
                    console.error("Failed to fetch profile", error);
                    // Fallback to local storage data if API fails
                    setValue("fullName", user.username);
                }
            );
        } else {
            navigate("/login");
        }
    }, [navigate, setValue]);

    const onSubmit = (data) => {
        setMessage("");
        setLoading(true);

        UserService.updateProfile(data).then(
            (response) => {
                setMessage(response.data.message);
                setLoading(false);
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                setMessage(resMessage);
                setLoading(false);
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
                                onClick={() => navigate("/profile")}
                                className="px-4 py-2 rounded-lg text-indigo-600 bg-indigo-50 font-medium transition-all duration-200"
                            >
                                Hồ sơ cá nhân
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto p-8">
                <div className="max-w-lg mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-200">
                            <span className="text-3xl font-bold text-white">
                                {currentUser?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {currentUser?.username}
                        </h2>
                        <p className="text-gray-500">{currentUser?.roles && currentUser.roles[0]?.replace('ROLE_', '')}</p>
                    </div>

                    {/* Profile Form */}
                    <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800">Chỉnh sửa thông tin</h4>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.includes("success") || message.includes("updated")
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"}`}>
                                <span className="text-lg">{message.includes("success") || message.includes("updated") ? "✅" : "⚠️"}</span>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Họ và tên</label>
                                <input
                                    type="text"
                                    {...register("fullName", { required: "Họ tên là bắt buộc" })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.fullName && <span className="text-sm text-red-500 mt-1 block">{errors.fullName.message}</span>}
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Số điện thoại</label>
                                <input
                                    type="text"
                                    {...register("phoneNumber", { required: "SĐT là bắt buộc" })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                    placeholder="0123 456 789"
                                />
                                {errors.phoneNumber && <span className="text-sm text-red-500 mt-1 block">{errors.phoneNumber.message}</span>}
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-gray-700">CCCD/CMND</label>
                                <input
                                    type="text"
                                    {...register("nationalId", { required: "CCCD là bắt buộc" })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                    placeholder="012345678901"
                                />
                                {errors.nationalId && <span className="text-sm text-red-500 mt-1 block">{errors.nationalId.message}</span>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Đang lưu...
                                    </span>
                                ) : "Lưu thay đổi"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
