import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "../services/auth.service";

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [successful, setSuccessful] = useState(false);

    const onSubmit = (data) => {
        setMessage("");
        setSuccessful(false);
        setLoading(true);

        AuthService.register(
            data.username,
            data.email,
            data.password,
            data.fullName,
            data.phoneNumber,
            data.nationalId,
            [] // Roles defaulted to STAFF by backend
        ).then(
            (response) => {
                setMessage(response.data.message);
                setSuccessful(true);
                setLoading(false);
                setTimeout(() => navigate("/login"), 2000);
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                setMessage(resMessage);
                setSuccessful(false);
                setLoading(false);
            }
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-card border border-gray-100">
                {/* Logo/Brand */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Tạo tài khoản
                    </h2>
                    <p className="text-gray-500 mt-2">Đăng ký để bắt đầu sử dụng SecureVault</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${successful
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"}`}>
                        <span className="text-lg">{successful ? "✅" : "⚠️"}</span>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Tên đăng nhập</label>
                            <input
                                type="text"
                                {...register("username", { required: "Tên đăng nhập là bắt buộc", minLength: { value: 3, message: "Tối thiểu 3 ký tự" } })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                placeholder="username"
                            />
                            {errors.username && <span className="text-sm text-red-500 mt-1 block">{errors.username.message}</span>}
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Email</label>
                            <input
                                type="email"
                                {...register("email", { required: "Email là bắt buộc" })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                placeholder="email@example.com"
                            />
                            {errors.email && <span className="text-sm text-red-500 mt-1 block">{errors.email.message}</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Họ và tên</label>
                        <input
                            type="text"
                            {...register("fullName")}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Mật khẩu</label>
                        <input
                            type="password"
                            {...register("password", { required: "Mật khẩu là bắt buộc", minLength: { value: 6, message: "Tối thiểu 6 ký tự" } })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                            placeholder="••••••••"
                        />
                        {errors.password && <span className="text-sm text-red-500 mt-1 block">{errors.password.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Số điện thoại</label>
                            <input
                                type="text"
                                {...register("phoneNumber")}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                placeholder="0123 456 789"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">CCCD/CMND</label>
                            <input
                                type="text"
                                {...register("nationalId")}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                placeholder="012345678901"
                            />
                        </div>
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
                                Đang tải...
                            </span>
                        ) : "Đăng ký"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <span>Đã có tài khoản? </span>
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
