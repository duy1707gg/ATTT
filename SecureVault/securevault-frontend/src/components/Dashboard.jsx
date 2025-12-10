import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import FileService from "../services/file.service";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";

const Dashboard = () => {
    const [currentUser, setCurrentUser] = useState(undefined);
    const [files, setFiles] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState("myFiles"); // myFiles, sharedFiles
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingShared, setLoadingShared] = useState(true);

    // Share Modal state
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareFileId, setShareFileId] = useState(null);
    const [shareFileName, setShareFileName] = useState("");
    const [shareEmails, setShareEmails] = useState([]);
    const [emailInput, setEmailInput] = useState("");
    const [shareLoading, setShareLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            loadFiles();
            loadSharedFiles();
        } else {
            navigate("/login");
        }
    }, []);

    const loadFiles = () => {
        setLoadingFiles(true);
        FileService.getFiles().then(
            (response) => {
                setFiles(response.data);
                setLoadingFiles(false);
            },
            (error) => {
                console.log(error);
                setLoadingFiles(false);
            }
        );
    };

    const loadSharedFiles = () => {
        setLoadingShared(true);
        FileService.getSharedFiles().then(
            (response) => {
                setSharedFiles(response.data);
                setLoadingShared(false);
            },
            (error) => {
                console.log(error);
                setLoadingShared(false);
            }
        );
    };

    const selectFile = (event) => {
        setSelectedFile(event.target.files[0]);
        setUploadProgress(0);
        setMessage("");
    };

    const upload = () => {
        if (!selectedFile) return;

        FileService.uploadFile(selectedFile, (event) => {
            setUploadProgress(Math.round((100 * event.loaded) / event.total));
        })
            .then((response) => {
                setMessage(response.data);
                loadFiles();
                setSelectedFile(null);
            })
            .catch((error) => {
                setUploadProgress(0);
                setMessage("Không thể tải lên tệp!");
                setSelectedFile(null);
            });
    };

    const download = (fileId, fileName) => {
        FileService.downloadFile(fileId, fileName);
    };

    // Share Modal functions
    const openShareModal = (fileId, fileName) => {
        setShareFileId(fileId);
        setShareFileName(fileName);
        setShareEmails([]);
        setEmailInput("");
        setShareModalOpen(true);
    };

    const closeShareModal = () => {
        setShareModalOpen(false);
        setShareFileId(null);
        setShareFileName("");
        setShareEmails([]);
        setEmailInput("");
    };

    const addEmail = () => {
        const trimmedEmail = emailInput.trim();
        if (trimmedEmail && !shareEmails.includes(trimmedEmail)) {
            setShareEmails([...shareEmails, trimmedEmail]);
            setEmailInput("");
        }
    };

    const removeEmail = (email) => {
        setShareEmails(shareEmails.filter(e => e !== email));
    };

    const submitShare = () => {
        if (shareEmails.length === 0) {
            alert("Vui lòng thêm ít nhất một email!");
            return;
        }
        setShareLoading(true);
        FileService.shareFileMultiple(shareFileId, shareEmails).then(
            (response) => {
                const result = response.data;
                let msg = `Chia sẻ thành công với ${result.successCount} người.`;
                if (result.notFoundEmails && result.notFoundEmails.length > 0) {
                    msg += `\nKhông tìm thấy: ${result.notFoundEmails.join(", ")}`;
                }
                alert(msg);
                closeShareModal();
                setShareLoading(false);
            },
            (error) => {
                alert("Lỗi khi chia sẻ: " + (error.response?.data || error.message));
                setShareLoading(false);
            }
        );
    };

    const deleteFile = (fileId, fileName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tệp "${fileName}"?`)) {
            FileService.deleteFile(fileId).then(
                (response) => {
                    setMessage(response.data);
                    loadFiles();
                },
                (error) => {
                    alert("Lỗi khi xóa tệp: " + (error.response?.data || error.message));
                }
            );
        }
    };

    const logOut = () => {
        AuthService.logout();
        navigate("/login");
    };

    if (!currentUser) return null;

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
                                className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-all duration-200"
                            >
                                Hồ sơ cá nhân
                            </button>
                            {currentUser.roles.includes("ROLE_ADMIN") && (
                                <button
                                    onClick={() => navigate("/admin/users")}
                                    className="px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium transition-all duration-200"
                                >
                                    Quản lý User
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span className="text-gray-700 font-medium">{currentUser.username}</span>
                                <span className="text-xs text-gray-500 block">{currentUser.roles[0]?.replace('ROLE_', '')}</span>
                            </div>
                        </div>
                        <button
                            onClick={logOut}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl transition-all duration-200 shadow-lg shadow-red-200"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto p-8">
                {currentUser.roles.includes("ROLE_ADMIN") && <AdminDashboard />}
                {currentUser.roles.includes("ROLE_MANAGER") && <ManagerDashboard />}

                {/* Upload Section */}
                <div className="bg-white rounded-2xl shadow-card p-6 mb-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Tải lên tệp bảo mật</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex-1">
                            <input
                                type="file"
                                onChange={selectFile}
                                className="hidden"
                            />
                            <div className="w-full px-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200">
                                <div className="text-gray-500">
                                    {selectedFile ? (
                                        <span className="text-indigo-600 font-medium">{selectedFile.name}</span>
                                    ) : (
                                        <>
                                            <span className="text-indigo-600 font-medium">Click để chọn tệp</span> hoặc kéo thả vào đây
                                        </>
                                    )}
                                </div>
                            </div>
                        </label>
                        <button
                            onClick={upload}
                            disabled={!selectedFile}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white font-semibold shadow-lg shadow-emerald-200"
                        >
                            Tải lên
                        </button>
                    </div>

                    {uploadProgress > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                            {message}
                        </div>
                    )}
                </div>

                {/* Files Section */}
                <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                        <button
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${activeTab === "myFiles"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-800"}`}
                            onClick={() => setActiveTab("myFiles")}
                        >
                            Tệp của tôi
                        </button>
                        <button
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${activeTab === "sharedFiles"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-800"}`}
                            onClick={() => setActiveTab("sharedFiles")}
                        >
                            Được chia sẻ với tôi
                        </button>
                    </div>

                    {activeTab === "myFiles" && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-200">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Tệp bảo mật của bạn</h2>
                            </div>
                            {files.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p>Chưa có tệp nào được tải lên.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-xs uppercase text-gray-500 bg-gray-50 rounded-lg">
                                            <tr>
                                                <th className="py-4 px-4 rounded-l-lg font-semibold">Tên tệp</th>
                                                <th className="py-4 px-4 font-semibold">Kích thước</th>
                                                <th className="py-4 px-4 font-semibold">Trạng thái</th>
                                                <th className="py-4 px-4 font-semibold">Ngày tải lên</th>
                                                <th className="py-4 px-4 font-semibold">Hành động</th>
                                                <th className="py-4 px-4 rounded-r-lg font-semibold">Chia sẻ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-700 divide-y divide-gray-100">
                                            {files.map((file) => (
                                                <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-4 font-medium text-gray-900">{file.fileName}</td>
                                                    <td className="py-4 px-4 text-gray-500">{(file.size / 1024).toFixed(2)} KB</td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${file.status === 'APPROVED'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : file.status === 'REJECTED'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-amber-100 text-amber-700'}`}>
                                                            {file.status === 'APPROVED' ? 'Đã duyệt' : file.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-500">{new Date(file.uploadedAt).toLocaleString()}</td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex gap-3 items-center">
                                                            {file.status === 'APPROVED' && (
                                                                <button
                                                                    onClick={() => download(file.id, file.fileName)}
                                                                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                    Tải xuống
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteFile(file.id, file.fileName)}
                                                                className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => openShareModal(file.id, file.fileName)}
                                                            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                            </svg>
                                                            Chia sẻ
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "sharedFiles" && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Được chia sẻ với tôi</h2>
                            </div>
                            {loadingShared ? (
                                <div className="text-center py-12">
                                    <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-emerald-500" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="text-gray-500 font-medium">Đang tải danh sách tệp được chia sẻ...</p>
                                </div>
                            ) : sharedFiles.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <p>Chưa có tệp nào được chia sẻ với bạn.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-xs uppercase text-gray-500 bg-gray-50 rounded-lg">
                                            <tr>
                                                <th className="py-4 px-4 rounded-l-lg font-semibold">Tên tệp</th>
                                                <th className="py-4 px-4 font-semibold">Người sở hữu</th>
                                                <th className="py-4 px-4 font-semibold">Kích thước</th>
                                                <th className="py-4 px-4 font-semibold">Ngày chia sẻ</th>
                                                <th className="py-4 px-4 rounded-r-lg font-semibold">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-700 divide-y divide-gray-100">
                                            {sharedFiles.map((file) => (
                                                <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-4 font-medium text-gray-900">{file.fileName}</td>
                                                    <td className="py-4 px-4 text-gray-500">{file.ownerUsername || "Không xác định"}</td>
                                                    <td className="py-4 px-4 text-gray-500">{(file.size / 1024).toFixed(2)} KB</td>
                                                    <td className="py-4 px-4 text-gray-500">{new Date(file.sharedAt || file.uploadedAt).toLocaleString()}</td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => download(file.id, file.fileName)}
                                                            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Tải xuống
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {shareModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Chia sẻ tệp
                            </h3>
                            <button onClick={closeShareModal} className="text-white/80 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-4">
                                Tệp: <span className="font-semibold text-gray-800">{shareFileName}</span>
                            </p>

                            {/* Email Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                                    placeholder="Nhập email người nhận..."
                                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                />
                                <button
                                    onClick={addEmail}
                                    className="px-4 py-2.5 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 font-medium transition-colors"
                                >
                                    + Thêm
                                </button>
                            </div>

                            {/* Email List */}
                            {shareEmails.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Người nhận ({shareEmails.length}):</p>
                                    <div className="max-h-32 overflow-y-auto space-y-2">
                                        {shareEmails.map((email, index) => (
                                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                                <span className="text-gray-700 text-sm">{email}</span>
                                                <button
                                                    onClick={() => removeEmail(email)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={submitShare}
                                disabled={shareEmails.length === 0 || shareLoading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {shareLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang chia sẻ...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Chia sẻ với {shareEmails.length} người
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
