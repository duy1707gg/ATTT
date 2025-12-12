import api from "./api";

const uploadFile = (file, onUploadProgress) => {
    let formData = new FormData();
    formData.append("file", file);

    return api.post("/files/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
    });
};

const getFiles = () => {
    return api.get("/files/list");
};

const downloadFile = (fileId, fileName) => {
    return api.get(`/files/download/${fileId}`, {
        responseType: 'blob',
    }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    });
};

const getSharedFiles = () => {
    return api.get("/files/shared");
};

const getPendingFiles = () => {
    return api.get("/files/pending");
};

const shareFile = (fileId, username) => {
    return api.post(`/files/share/${fileId}?username=${username}`);
};

const shareFileMultiple = (fileId, emails) => {
    return api.post(`/files/share-multiple/${fileId}`, emails);
};

const approveFile = (fileId, approved) => {
    return api.put(`/files/approve/${fileId}?approved=${approved}`);
};

const deleteFile = (fileId) => {
    return api.delete(`/files/delete/${fileId}`);
};

const downloadFileBlob = async (fileId) => {
    const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob',
    });
    return response.data;
};

const FileService = {
    uploadFile,
    getFiles,
    downloadFile,
    downloadFileBlob,
    getSharedFiles,
    getPendingFiles,
    shareFile,
    shareFileMultiple,
    approveFile,
    deleteFile,
};

export default FileService;
