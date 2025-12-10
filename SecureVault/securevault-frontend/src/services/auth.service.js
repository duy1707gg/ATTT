import api from "./api";

const register = (username, email, password, fullName, phoneNumber, nationalId, role) => {
    return api.post("/auth/signup", {
        username,
        email,
        password,
        fullName,
        phoneNumber,
        nationalId,
        role: [role]
    });
};

const login = (username, password) => {
    return api.post("/auth/signin", {
        username,
        password,
    });
};

const verifyOtp = (username, otp) => {
    return api.post("/auth/verify-otp", {
        username,
        otp,
    })
        .then((response) => {
            if (response.data.token) {
                // Store token with expiration info
                const userData = {
                    ...response.data,
                    tokenExpiry: Date.now() + (response.data.expiresIn || 86400000) // Default 24h
                };
                localStorage.setItem("user", JSON.stringify(userData));
            }
            return response.data;
        });
};

const refreshToken = async () => {
    try {
        const user = getCurrentUser();
        if (!user || !user.refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await api.post("/auth/refresh-token", {
            refreshToken: user.refreshToken
        });

        if (response.data.token) {
            const userData = {
                ...user,
                token: response.data.token,
                tokenExpiry: Date.now() + (response.data.expiresIn || 86400000)
            };
            localStorage.setItem("user", JSON.stringify(userData));
            return response.data.token;
        }
        throw new Error("Failed to refresh token");
    } catch (error) {
        // If refresh fails, log out the user
        logout();
        throw error;
    }
};

const isTokenExpired = () => {
    const user = getCurrentUser();
    if (!user || !user.tokenExpiry) return true;
    // Consider token expired 5 minutes before actual expiry
    return Date.now() > user.tokenExpiry - 5 * 60 * 1000;
};

const logout = () => {
    localStorage.removeItem("user");
    // Redirect to login if needed
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", { email });
};

const resetPassword = (email, otp, newPassword) => {
    return api.post("/auth/reset-password", {
        email,
        otp,
        newPassword
    });
};

const resendOtp = (username, email) => {
    return api.post("/auth/resend-otp", {
        username,
        email
    });
};

const AuthService = {
    register,
    login,
    verifyOtp,
    refreshToken,
    isTokenExpired,
    logout,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    resendOtp,
};

export default AuthService;
