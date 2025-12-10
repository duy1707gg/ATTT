import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const newPassword = watch("newPassword");

    const onSendOtp = async (data) => {
        setMessage("");
        setError("");
        setLoading(true);
        try {
            await AuthService.forgotPassword(data.email);
            setEmail(data.email);
            setStep(2);
            setMessage("Mã OTP đã được gửi về email. Vui lòng kiểm tra.");
        } catch (err) {
            setError(err.response?.data?.message || "Gửi OTP thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const onResetPassword = async (data) => {
        setMessage("");
        setError("");
        setLoading(true);
        try {
            await AuthService.resetPassword(email, data.otp, data.newPassword);
            setMessage("Đổi mật khẩu thành công! Đang chuyển hướng...");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Đổi mật khẩu thất bại.");
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="bg-white p-8 rounded-2xl shadow-card w-full max-w-md border border-gray-100">
                {/* Logo/Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                        {step === 1 ? "Quên Mật Khẩu" : "Đặt Lại Mật Khẩu"}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {step === 1 ? "Nhập email để nhận mã OTP" : "Nhập mã OTP và mật khẩu mới"}
                    </p>
                </div>

                {message && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-4 text-sm flex items-center gap-3 border border-emerald-200">
                        <span className="text-lg">✅</span>
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 text-sm flex items-center gap-3 border border-red-200">
                        <span className="text-lg">⚠️</span>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSubmit(onSendOtp)}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                {...register("email", { required: "Email là bắt buộc" })}
                                disabled={loading}
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 shadow-lg shadow-amber-200 transform hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang gửi...
                                </span>
                            ) : "Gửi OTP"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit(onResetPassword)}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed border border-gray-200"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Mã OTP</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-center font-mono text-xl tracking-widest placeholder-gray-400 transition-all duration-200"
                                    {...register("otp", { required: "Mã OTP là bắt buộc" })}
                                    placeholder="• • • • • •"
                                />
                            </div>
                            {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>}
                            <div className="text-right mt-1">
                                <ResendOtpButton email={email} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Mật khẩu mới</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                {...register("newPassword", {
                                    required: "Mật khẩu mới là bắt buộc",
                                    minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" }
                                })}
                                placeholder="••••••••"
                            />
                            {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Xác nhận mật khẩu</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                {...register("confirmPassword", {
                                    required: "Vui lòng xác nhận mật khẩu",
                                    validate: value => value === newPassword || "Mật khẩu không khớp"
                                })}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-lg shadow-purple-200 transform hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
                        ← Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

const ResendOtpButton = ({ username, email }) => {
    const [countdown, setCountdown] = useState(0);

    React.useEffect(() => {
        setCountdown(60);
    }, []);

    React.useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = () => {
        setCountdown(60);
        AuthService.resendOtp(username, email).then(
            () => {
                alert("Mã OTP mới đã được gửi!");
            },
            (err) => {
                alert("Lỗi gửi lại OTP: " + (err.response?.data?.message || err.message));
            }
        );
    };

    return (
        <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className={`text-sm font-medium transition-colors ${countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-amber-600 hover:text-amber-700"}`}
        >
            {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã OTP"}
        </button>
    );
};

export default ForgotPassword;
