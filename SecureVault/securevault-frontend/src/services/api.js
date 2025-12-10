import axios from "axios";

const instance = axios.create({
    baseURL: "/api", // Use relative path to leverage Vite proxy
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token
instance.interceptors.request.use(
    async (config) => {
        // Skip auth for public endpoints
        const publicEndpoints = ['/auth/signin', '/auth/signup', '/auth/verify-otp', '/auth/refresh-token'];
        if (publicEndpoints.some(endpoint => config.url?.includes(endpoint))) {
            return config;
        }

        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.token) {
            // Check if token is about to expire (5 minutes buffer)
            if (user.tokenExpiry && Date.now() > user.tokenExpiry - 5 * 60 * 1000) {
                // Try to refresh token
                try {
                    const AuthService = (await import('./auth.service')).default;
                    const newToken = await AuthService.refreshToken();
                    config.headers["Authorization"] = 'Bearer ' + newToken;
                } catch (error) {
                    // Refresh failed, will be handled by response interceptor
                    console.error("Token refresh failed in request interceptor");
                }
            } else {
                config.headers["Authorization"] = 'Bearer ' + user.token;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 errors
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const AuthService = (await import('./auth.service')).default;
                const newToken = await AuthService.refreshToken();

                // Update the failed request with new token
                originalRequest.headers["Authorization"] = 'Bearer ' + newToken;
                return instance(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                const AuthService = (await import('./auth.service')).default;
                AuthService.logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
