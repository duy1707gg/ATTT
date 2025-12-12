import api from "./api";

const FolderService = {
    // Lấy danh sách thư mục
    getFolders: (parentId = null) => {
        const params = parentId ? `?parentId=${parentId}` : "";
        return api.get(`/folders${params}`);
    },

    // Lấy thông tin một thư mục
    getFolder: (id) => {
        return api.get(`/folders/${id}`);
    },

    // Tạo thư mục mới
    createFolder: (name, parentId = null) => {
        return api.post("/folders", { name, parentId });
    },

    // Đổi tên thư mục
    renameFolder: (id, name) => {
        return api.put(`/folders/${id}`, { name });
    },

    // Xóa thư mục
    deleteFolder: (id) => {
        return api.delete(`/folders/${id}`);
    },

    // Lấy files trong thư mục
    getFilesInFolder: (folderId) => {
        if (folderId === null || folderId === undefined) {
            return api.get("/folders/root/files");
        }
        return api.get(`/folders/${folderId}/files`);
    },

    // Di chuyển file vào thư mục
    moveFileToFolder: (fileId, folderId) => {
        return api.put("/folders/move-file", { fileId, folderId });
    },

    // Lấy breadcrumb
    getBreadcrumb: (folderId) => {
        if (!folderId) return Promise.resolve({ data: [] });
        return api.get(`/folders/${folderId}/breadcrumb`);
    },

    // Upload file vào thư mục
    uploadFileToFolder: (file, folderId, onUploadProgress) => {
        const formData = new FormData();
        formData.append("file", file);
        if (folderId) {
            formData.append("folderId", folderId);
        }
        return api.post("/files/upload-to-folder", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress,
        });
    },

    // Chia sẻ thư mục với nhiều người
    shareFolder: (folderId, emails) => {
        return api.post(`/folders/${folderId}/share`, emails);
    },

    // Lấy danh sách thư mục được chia sẻ với user
    getSharedFolders: () => {
        return api.get("/folders/shared");
    },

    // Lấy files trong thư mục được chia sẻ
    getFilesInSharedFolder: (folderId) => {
        return api.get(`/folders/shared/${folderId}/files`);
    },

    // Tải thư mục dưới dạng ZIP (thư mục của mình)
    downloadFolderAsZip: async (folderId, folderName) => {
        try {
            const response = await api.get(`/folders/${folderId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${folderName}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            throw error;
        }
    },

    // Tải thư mục được chia sẻ dưới dạng ZIP
    downloadSharedFolderAsZip: async (folderId, folderName) => {
        try {
            const response = await api.get(`/folders/shared/${folderId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${folderName}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            throw error;
        }
    },
};

export default FolderService;
