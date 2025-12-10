import api from "./api";

const getPublicContent = () => {
    return api.get("/test/all");
};

const getUserBoard = () => {
    return api.get("/test/user");
};

const getManagerBoard = () => {
    return api.get("/test/mod");
};

const getAdminBoard = () => {
    return api.get("/test/admin");
};

// --- New Features ---

const getProfile = () => {
    return api.get("/users/profile");
};

const updateProfile = (profileData) => {
    return api.put("/users/profile", profileData);
};

// Admin: Get all users
const getAllUsers = () => {
    return api.get("/users/all");
};

// Admin: Create user
const createUser = (userData) => {
    return api.post("/users/create", userData);
};

// Admin: Delete user
const deleteUser = (id) => {
    return api.delete(`/users/${id}`);
};

const UserService = {
    getPublicContent,
    getUserBoard,
    getManagerBoard,
    getAdminBoard,
    getProfile,
    updateProfile,
    getAllUsers,
    createUser,
    deleteUser
};

export default UserService;
