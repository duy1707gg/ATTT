import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "../services/auth.service";

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [step, setStep] = useState(1); // 1: Login, 2: OTP
    const [username, setUsername] = useState("");

    const onSubmitLogin = (data) => {
        setMessage("");
        setLoading(true);

        AuthService.login(data.username, data.password).then(
            (response) => {
                // Expecting "OTP sent" message
                setUsername(data.username);
                setStep(2);
                setLoading(false);
                setMessage(response.data.message);
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                setLoading(false);
                setMessage(resMessage);
            }
        );
    };

    const onSubmitOtp = (data) => {
        setMessage("");
        setLoading(true);

        AuthService.verifyOtp(username, data.otp).then(
            () => {
                navigate("/dashboard");
                window.location.reload();
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                setLoading(false);
                setMessage(resMessage);
            }
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-card border border-gray-100">
                {/* Logo/Brand */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        {step === 1 ? "Đăng nhập SecureVault" : "Xác thực OTP"}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {step === 1 ? "Chào mừng bạn trở lại!" : "Nhập mã đã gửi về email"}
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${message.includes("Error") || message.includes("Sai") || message.includes("không")
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        <span className="text-lg">{message.includes("Error") ? "⚠️" : "✅"}</span>
                        {message}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-5">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Tên đăng nhập</label>
                            <input
                                type="text"
                                {...register("username", { required: "Tên đăng nhập là bắt buộc" })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                placeholder="Nhập tên đăng nhập"
                            />
                            {errors.username && <span className="text-sm text-red-500 mt-1 block">{errors.username.message}</span>}
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Mật khẩu</label>
                            <input
                                type="password"
                                {...register("password", { required: "Mật khẩu là bắt buộc" })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                                placeholder="Nhập mật khẩu"
                            />
                            {errors.password && <span className="text-sm text-red-500 mt-1 block">{errors.password.message}</span>}
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
                            ) : "Đăng nhập"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit(onSubmitOtp)} className="space-y-5">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">Nhập mã OTP đã gửi về email</label>
                            <input
                                type="text"
                                {...register("otp", { required: "Mã OTP là bắt buộc" })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 tracking-widest text-center text-xl font-mono placeholder-gray-400 transition-all duration-200"
                                placeholder="• • • • • •"
                            />
                            {errors.otp && <span className="text-sm text-red-500 mt-1 block">{errors.otp.message}</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-200 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            {loading ? "Đang xác thực..." : "Xác thực OTP"}
                        </button>

                        <div className="text-center mt-2">
                            <ResendOtpButton username={username} />
                        </div>
                    </form>
                )}

                <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium block mb-2 transition-colors">
                        Quên mật khẩu?
                    </Link>
                    <span>Chưa có tài khoản? </span>
                    <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                        Đăng ký
                    </Link>
                </div>
            </div>
        </div>
    );
};

const ResendOtpButton = ({ username, email }) => {
    const [countdown, setCountdown] = useState(0); // 0 means ready to send

    // Start countdown on mount (implying we just sent one) or manual trigger? 
    // Actually, usually when we land on OTP page, one was just sent.
    // So let's start with 60s.
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
                // Toast or logs? For now simple alert or rely on parent message if we passed a handler.
                // Keeping it self-contained for UI feedback locally isn't easy without state lift.
                // Let's just alert for minimal impact.
                alert("Mã OTP mới đã được gửi!");
            },
            (err) => {
                alert("Lỗi gửi lại OTP: " + err.message);
            }
        );
    };

    return (
        <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className={`text-sm font-medium transition-colors ${countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-700"}`}
        >
            {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã OTP"}
        </button>
    );
};

export default Login;
