import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import FileService from "../services/file.service";
import FolderService from "../services/folder.service";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

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

    // Shared folders state
    const [sharedFolders, setSharedFolders] = useState([]);
    const [loadingSharedFolders, setLoadingSharedFolders] = useState(true);

    // Share Modal state
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareFileId, setShareFileId] = useState(null);
    const [shareFileName, setShareFileName] = useState("");
    const [shareEmails, setShareEmails] = useState([]);
    const [emailInput, setEmailInput] = useState("");
    const [shareLoading, setShareLoading] = useState(false);

    // Folder state
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [editingFolder, setEditingFolder] = useState(null);
    const [folderLoading, setFolderLoading] = useState(false);

    // Move file modal state
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [moveFileId, setMoveFileId] = useState(null);
    const [moveFileName, setMoveFileName] = useState("");
    const [targetFolderId, setTargetFolderId] = useState(null);
    const [allFolders, setAllFolders] = useState([]);
    const [moveLoading, setMoveLoading] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, folderId: null, folderName: "" });

    // Upload to folder state - persists when file picker opens
    const [uploadTargetFolder, setUploadTargetFolder] = useState({ id: null, name: "" });

    // Upload to folder ref
    const folderUploadRef = React.useRef(null);

    // Directory upload ref and state
    const directoryUploadRef = React.useRef(null);
    const [directoryUploadProgress, setDirectoryUploadProgress] = useState({ uploading: false, current: 0, total: 0, folderName: "" });

    // Folder preview state
    const [folderPreview, setFolderPreview] = useState({ open: false, folderId: null, folderName: "", files: [], isShared: false });

    // Folder share modal state  
    const [folderShareModal, setFolderShareModal] = useState({ open: false, folderId: null, folderName: "" });
    const [folderShareEmails, setFolderShareEmails] = useState([]);
    const [folderShareEmailInput, setFolderShareEmailInput] = useState("");
    const [folderShareLoading, setFolderShareLoading] = useState(false);

    // File preview state
    const [filePreview, setFilePreview] = useState({ open: false, fileId: null, fileName: "", fileType: "", previewUrl: null });
    // Office document content (Word/Excel parsed to HTML)
    const [officeContent, setOfficeContent] = useState({ html: null, loading: false, error: null });

    const navigate = useNavigate();

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            loadFilesInFolder(null);
            loadFolders(null);
            loadSharedFiles();
            loadSharedFolders();
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

    const loadFilesInFolder = (folderId) => {
        setLoadingFiles(true);
        FolderService.getFilesInFolder(folderId).then(
            (response) => {
                setFiles(response.data);
                setLoadingFiles(false);
            },
            (error) => {
                console.log(error);
                setLoadingFiles(false);
            }
        );
        // Load breadcrumb
        if (folderId) {
            FolderService.getBreadcrumb(folderId).then(
                (response) => setBreadcrumb(response.data),
                (error) => console.log(error)
            );
        } else {
            setBreadcrumb([]);
        }
    };

    const loadFolders = (parentId) => {
        FolderService.getFolders(parentId).then(
            (response) => setFolders(response.data),
            (error) => console.log(error)
        );
    };

    // Load shared folders
    const loadSharedFolders = () => {
        setLoadingSharedFolders(true);
        FolderService.getSharedFolders().then(
            (response) => {
                setSharedFolders(response.data);
                setLoadingSharedFolders(false);
            },
            (error) => {
                console.log(error);
                setLoadingSharedFolders(false);
            }
        );
    };

    const navigateToFolder = (folderId) => {
        setCurrentFolderId(folderId);
        loadFilesInFolder(folderId);
        loadFolders(folderId);
    };

    const openCreateFolderModal = () => {
        setEditingFolder(null);
        setFolderName("");
        setFolderModalOpen(true);
    };

    const openRenameFolderModal = (folder) => {
        setEditingFolder(folder);
        setFolderName(folder.name);
        setFolderModalOpen(true);
    };

    const closeFolderModal = () => {
        setFolderModalOpen(false);
        setEditingFolder(null);
        setFolderName("");
    };

    const submitFolder = () => {
        if (!folderName.trim()) return;
        setFolderLoading(true);

        if (editingFolder) {
            FolderService.renameFolder(editingFolder.id, folderName).then(
                () => {
                    loadFolders(currentFolderId);
                    closeFolderModal();
                    setFolderLoading(false);
                },
                (error) => {
                    alert("Lỗi: " + (error.response?.data || error.message));
                    setFolderLoading(false);
                }
            );
        } else {
            FolderService.createFolder(folderName, currentFolderId).then(
                () => {
                    loadFolders(currentFolderId);
                    closeFolderModal();
                    setFolderLoading(false);
                },
                (error) => {
                    alert("Lỗi: " + (error.response?.data || error.message));
                    setFolderLoading(false);
                }
            );
        }
    };

    const deleteFolder = (folderId, folderNameToDelete) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folderNameToDelete}"? Tất cả files và thư mục con sẽ bị xóa.`)) {
            FolderService.deleteFolder(folderId).then(
                () => loadFolders(currentFolderId),
                (error) => alert("Lỗi xóa thư mục: " + (error.response?.data || error.message))
            );
        }
    };

    // Load all folders for move modal (flat list)
    const loadAllFoldersRecursive = async (parentId = null, prefix = "") => {
        try {
            const response = await FolderService.getFolders(parentId);
            let result = [];
            for (const folder of response.data) {
                result.push({ ...folder, displayName: prefix + folder.name });
                const children = await loadAllFoldersRecursive(folder.id, prefix + folder.name + " / ");
                result = result.concat(children);
            }
            return result;
        } catch (error) {
            console.log(error);
            return [];
        }
    };

    const openMoveModal = async (fileId, fileName) => {
        setMoveFileId(fileId);
        setMoveFileName(fileName);
        setTargetFolderId(null);
        setMoveModalOpen(true);
        const folders = await loadAllFoldersRecursive();
        setAllFolders(folders);
    };

    const closeMoveModal = () => {
        setMoveModalOpen(false);
        setMoveFileId(null);
        setMoveFileName("");
        setTargetFolderId(null);
    };

    const submitMoveFile = () => {
        setMoveLoading(true);
        FolderService.moveFileToFolder(moveFileId, targetFolderId).then(
            () => {
                loadFilesInFolder(currentFolderId);
                closeMoveModal();
                setMoveLoading(false);
                alert("Đã di chuyển file thành công!");
            },
            (error) => {
                alert("Lỗi di chuyển file: " + (error.response?.data || error.message));
                setMoveLoading(false);
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

        // Upload to root (null) - main upload section
        FileService.uploadFile(selectedFile, (event) => {
            setUploadProgress(Math.round((100 * event.loaded) / event.total));
        })
            .then((response) => {
                setMessage(response.data);
                loadFilesInFolder(null); // Refresh root files
                setSelectedFile(null);
            })
            .catch((error) => {
                setUploadProgress(0);
                setMessage("Không thể tải lên tệp!");
                setSelectedFile(null);
            });
    };

    // Context menu functions
    const handleFolderRightClick = (e, folderId, folderName) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            folderId,
            folderName
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, folderId: null, folderName: "" });
    };

    const handleUploadToFolder = () => {
        // Save folder info BEFORE closing context menu and opening file picker
        setUploadTargetFolder({ id: contextMenu.folderId, name: contextMenu.folderName });
        closeContextMenu();
        // Small delay to ensure state is updated before file picker opens
        setTimeout(() => {
            if (folderUploadRef.current) {
                folderUploadRef.current.click();
            }
        }, 100);
    };

    const handleFolderFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file || !uploadTargetFolder.id) return;

        FolderService.uploadFileToFolder(file, uploadTargetFolder.id, () => { })
            .then(() => {
                alert(`Đã tải "${file.name}" vào thư mục "${uploadTargetFolder.name}"`);
                loadFilesInFolder(currentFolderId);
                loadFolders(currentFolderId);
                setUploadTargetFolder({ id: null, name: "" });
            })
            .catch((error) => {
                alert("Lỗi tải file: " + (error.response?.data || error.message));
            });
        event.target.value = "";
    };

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible]);

    // Handle directory upload - creates folder and uploads all files
    const handleDirectoryUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Get folder name from first file's path
        const firstFilePath = files[0].webkitRelativePath;
        const folderName = firstFilePath.split('/')[0];

        setDirectoryUploadProgress({ uploading: true, current: 0, total: files.length, folderName });

        try {
            // Create the folder first
            const folderResponse = await FolderService.createFolder(folderName, currentFolderId);
            const newFolderId = folderResponse.data.id;

            // Upload all files to the new folder
            let uploadedCount = 0;
            for (const file of files) {
                try {
                    await FolderService.uploadFileToFolder(file, newFolderId, () => { });
                    uploadedCount++;
                    setDirectoryUploadProgress(prev => ({ ...prev, current: uploadedCount }));
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                }
            }

            alert(`Đã tải lên thư mục "${folderName}" với ${uploadedCount}/${files.length} tệp!`);
            loadFolders(currentFolderId);
            loadFilesInFolder(currentFolderId);
        } catch (error) {
            alert("Lỗi tạo thư mục: " + (error.response?.data || error.message));
        } finally {
            setDirectoryUploadProgress({ uploading: false, current: 0, total: 0, folderName: "" });
            event.target.value = "";
        }
    };

    // Folder Preview functions
    const openFolderPreview = async (folderId, folderName, isShared = false) => {
        try {
            // Use appropriate API based on whether folder is shared or owned
            const response = isShared
                ? await FolderService.getFilesInSharedFolder(folderId)
                : await FolderService.getFilesInFolder(folderId);
            setFolderPreview({ open: true, folderId, folderName, files: response.data, isShared });
        } catch (error) {
            alert("Lỗi tải danh sách file: " + (error.response?.data || error.message));
        }
    };

    const closeFolderPreview = () => {
        setFolderPreview({ open: false, folderId: null, folderName: "", files: [], isShared: false });
    };

    // Folder Share functions
    const openFolderShareModal = (folderId, folderName) => {
        setFolderShareModal({ open: true, folderId, folderName });
        setFolderShareEmails([]);
        setFolderShareEmailInput("");
    };

    const closeFolderShareModal = () => {
        setFolderShareModal({ open: false, folderId: null, folderName: "" });
        setFolderShareEmails([]);
        setFolderShareEmailInput("");
    };

    const addFolderShareEmail = () => {
        const trimmed = folderShareEmailInput.trim();
        if (trimmed && !folderShareEmails.includes(trimmed)) {
            setFolderShareEmails([...folderShareEmails, trimmed]);
            setFolderShareEmailInput("");
        }
    };

    const removeFolderShareEmail = (email) => {
        setFolderShareEmails(folderShareEmails.filter(e => e !== email));
    };

    const submitFolderShare = async () => {
        if (folderShareEmails.length === 0) return;
        setFolderShareLoading(true);
        try {
            // Call the folder share API
            await FolderService.shareFolder(folderShareModal.folderId, folderShareEmails);
            alert(`Đã chia sẻ thư mục "${folderShareModal.folderName}" với ${folderShareEmails.length} người!`);
            closeFolderShareModal();
        } catch (error) {
            alert("Lỗi chia sẻ thư mục: " + (error.response?.data || error.message));
        } finally {
            setFolderShareLoading(false);
        }
    };

    // Folder Download as ZIP
    const downloadFolder = async (folderId, folderName) => {
        try {
            alert("Đang chuẩn bị tải xuống thư mục dưới dạng ZIP...");
            await FolderService.downloadFolderAsZip(folderId, folderName);
            alert(`Đã tải xuống thư mục "${folderName}" thành công!`);
        } catch (error) {
            if (error.response?.status === 204) {
                alert("Thư mục trống, không có file để tải!");
            } else {
                alert("Lỗi tải thư mục: " + (error.response?.data || error.message));
            }
        }
    };

    // Download Shared Folder as ZIP
    const downloadSharedFolder = async (folderId, folderName) => {
        try {
            alert("Đang chuẩn bị tải xuống thư mục được chia sẻ dưới dạng ZIP...");
            await FolderService.downloadSharedFolderAsZip(folderId, folderName);
            alert(`Đã tải xuống thư mục "${folderName}" thành công!`);
        } catch (error) {
            if (error.response?.status === 204) {
                alert("Thư mục trống, không có file để tải!");
            } else {
                alert("Lỗi tải thư mục: " + (error.response?.data || error.message));
            }
        }
    };

    // File Preview functions
    const openFilePreview = async (fileId, fileName, fileType) => {
        try {
            // Reset office content
            setOfficeContent({ html: null, loading: false, error: null });

            // Load file for preview
            const blob = await FileService.downloadFileBlob(fileId);
            const url = URL.createObjectURL(blob);

            // Check if it's a Word document
            const isWord = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                fileType === 'application/msword' ||
                fileName.toLowerCase().endsWith('.docx') ||
                fileName.toLowerCase().endsWith('.doc');

            // Check if it's an Excel document
            const isExcel = fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                fileType === 'application/vnd.ms-excel' ||
                fileName.toLowerCase().endsWith('.xlsx') ||
                fileName.toLowerCase().endsWith('.xls');

            // Show preview modal first
            setFilePreview({ open: true, fileId, fileName, fileType, previewUrl: url });

            // Parse Word document
            if (isWord) {
                setOfficeContent({ html: null, loading: true, error: null });
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setOfficeContent({ html: result.value, loading: false, error: null });
                } catch (err) {
                    setOfficeContent({ html: null, loading: false, error: 'Không thể đọc file Word: ' + err.message });
                }
            }

            // Parse Excel document
            if (isExcel) {
                setOfficeContent({ html: null, loading: true, error: null });
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                    // Convert all sheets to HTML
                    let htmlContent = '';
                    workbook.SheetNames.forEach((sheetName, index) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const sheetHtml = XLSX.utils.sheet_to_html(worksheet, { id: `sheet-${index}` });
                        htmlContent += `<div class="sheet-container"><h3 class="sheet-title">${sheetName}</h3>${sheetHtml}</div>`;
                    });

                    setOfficeContent({ html: htmlContent, loading: false, error: null });
                } catch (err) {
                    setOfficeContent({ html: null, loading: false, error: 'Không thể đọc file Excel: ' + err.message });
                }
            }
        } catch (error) {
            alert("Lỗi xem trước: " + (error.response?.data || error.message));
        }
    };

    const closeFilePreview = () => {
        if (filePreview.previewUrl) {
            URL.revokeObjectURL(filePreview.previewUrl);
        }
        setFilePreview({ open: false, fileId: null, fileName: "", fileType: "", previewUrl: null });
        setOfficeContent({ html: null, loading: false, error: null });
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
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-200">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">Tệp bảo mật của bạn</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={openCreateFolderModal}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-amber-200 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        </svg>
                                        Tạo thư mục
                                    </button>
                                    <button
                                        onClick={() => directoryUploadRef.current?.click()}
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload thư mục
                                    </button>
                                </div>
                            </div>

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 mb-4 text-sm">
                                <button
                                    onClick={() => navigateToFolder(null)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${currentFolderId === null ? 'text-indigo-600 font-semibold' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Trang chủ
                                </button>
                                {breadcrumb.map((folder, index) => (
                                    <React.Fragment key={folder.id}>
                                        <span className="text-gray-400">/</span>
                                        <button
                                            onClick={() => navigateToFolder(folder.id)}
                                            className={`px-2 py-1 rounded-lg transition-colors ${index === breadcrumb.length - 1 ? 'text-indigo-600 font-semibold' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                        >
                                            {folder.name}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Folder List */}
                            {folders.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            className="group relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:border-amber-300 transition-all duration-200"
                                            onClick={() => navigateToFolder(folder.id)}
                                            onContextMenu={(e) => handleFolderRightClick(e, folder.id, folder.name)}
                                        >
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-amber-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700 text-center truncate w-full">{folder.name}</span>
                                                <span className="text-xs text-gray-400">{folder.fileCount} tệp</span>
                                            </div>
                                            {/* Context buttons */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openRenameFolderModal(folder); }}
                                                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-indigo-50 text-indigo-600"
                                                    title="Đổi tên"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id, folder.name); }}
                                                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 text-red-500"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {files.length === 0 && folders.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p>Thư mục trống. Tải lên tệp hoặc tạo thư mục mới.</p>
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
                                                                onClick={() => openFilePreview(file.id, file.fileName, file.fileType)}
                                                                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                Xem trước
                                                            </button>
                                                            <button
                                                                onClick={() => openMoveModal(file.id, file.fileName)}
                                                                className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                                </svg>
                                                                Di chuyển
                                                            </button>
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

                            {/* Shared Folders Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    Thư mục được chia sẻ
                                </h3>
                                {loadingSharedFolders ? (
                                    <div className="text-center py-6">
                                        <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    </div>
                                ) : sharedFolders.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
                                        <p>Chưa có thư mục nào được chia sẻ với bạn.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto bg-gray-50 rounded-xl">
                                        <table className="w-full text-left">
                                            <thead className="text-xs uppercase text-gray-500 bg-indigo-50 rounded-lg">
                                                <tr>
                                                    <th className="py-3 px-4 rounded-l-lg font-semibold">Tên thư mục</th>
                                                    <th className="py-3 px-4 font-semibold">Người sở hữu</th>
                                                    <th className="py-3 px-4 font-semibold">Số tệp</th>
                                                    <th className="py-3 px-4 font-semibold">Ngày chia sẻ</th>
                                                    <th className="py-3 px-4 font-semibold">Hết hạn</th>
                                                    <th className="py-3 px-4 rounded-r-lg font-semibold">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-700 divide-y divide-gray-100">
                                                {sharedFolders.map((folder) => (
                                                    <tr key={folder.id} className="hover:bg-white transition-colors">
                                                        <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                            </svg>
                                                            {folder.folderName}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-500">{folder.ownerUsername || "Không xác định"}</td>
                                                        <td className="py-3 px-4 text-gray-500">{folder.fileCount} tệp</td>
                                                        <td className="py-3 px-4 text-gray-500">{new Date(folder.sharedAt).toLocaleString()}</td>
                                                        <td className="py-3 px-4">
                                                            {folder.expiresAt ? (
                                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${new Date(folder.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-indigo-100 text-indigo-700'
                                                                    }`}>
                                                                    {new Date(folder.expiresAt).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => openFolderPreview(folder.id, folder.folderName, true)}
                                                                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    Xem
                                                                </button>
                                                                <button
                                                                    onClick={() => downloadSharedFolder(folder.id, folder.folderName)}
                                                                    className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                    Tải
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Shared Files Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Tệp được chia sẻ
                                </h3>
                                {loadingShared ? (
                                    <div className="text-center py-12">
                                        <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-emerald-500" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <p className="text-gray-500 font-medium">Đang tải danh sách tệp được chia sẻ...</p>
                                    </div>
                                ) : sharedFiles.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
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
                                                    <th className="py-4 px-4 font-semibold">Hết hạn</th>
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
                                                            {file.expiresAt ? (
                                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${new Date(file.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-emerald-100 text-emerald-700'
                                                                    }`}>
                                                                    {new Date(file.expiresAt).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => openFilePreview(file.id, file.fileName, file.fileType)}
                                                                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    Xem
                                                                </button>
                                                                <button
                                                                    onClick={() => download(file.id, file.fileName)}
                                                                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                    Tải
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
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

            {/* Folder Modal */}
            {folderModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                {editingFolder ? 'Đổi tên thư mục' : 'Tạo thư mục mới'}
                            </h3>
                            <button onClick={closeFolderModal} className="text-white/80 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên thư mục
                            </label>
                            <input
                                type="text"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && submitFolder()}
                                placeholder="Nhập tên thư mục..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                                autoFocus
                            />

                            {/* Submit Button */}
                            <button
                                onClick={submitFolder}
                                disabled={!folderName.trim() || folderLoading}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {folderLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {editingFolder ? 'Lưu thay đổi' : 'Tạo thư mục'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move File Modal */}
            {moveModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                Di chuyển file
                            </h3>
                            <button onClick={closeMoveModal} className="text-white/80 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-4">
                                File: <span className="font-semibold text-gray-800">{moveFileName}</span>
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn thư mục đích
                            </label>
                            <select
                                value={targetFolderId || ""}
                                onChange={(e) => setTargetFolderId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                            >
                                <option value="">📁 Thư mục gốc (Root)</option>
                                {allFolders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        📁 {folder.displayName}
                                    </option>
                                ))}
                            </select>

                            {/* Submit Button */}
                            <button
                                onClick={submitMoveFile}
                                disabled={moveLoading}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {moveLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Đang di chuyển...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Di chuyển
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu for Folder */}
            {contextMenu.visible && (
                <div
                    className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 min-w-48"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-100">
                        📁 {contextMenu.folderName}
                    </div>
                    <button
                        onClick={handleUploadToFolder}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Tải file vào thư mục này
                    </button>
                    <button
                        onClick={() => { navigateToFolder(contextMenu.folderId); closeContextMenu(); }}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Mở thư mục
                    </button>
                    <button
                        onClick={() => { openFolderPreview(contextMenu.folderId, contextMenu.folderName); closeContextMenu(); }}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Xem trước
                    </button>
                    <button
                        onClick={() => { openFolderShareModal(contextMenu.folderId, contextMenu.folderName); closeContextMenu(); }}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Chia sẻ thư mục
                    </button>
                    <button
                        onClick={() => { downloadFolder(contextMenu.folderId, contextMenu.folderName); closeContextMenu(); }}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Tải xuống (ZIP)
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                        onClick={() => { deleteFolder(contextMenu.folderId, contextMenu.folderName); closeContextMenu(); }}
                        className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa thư mục
                    </button>
                </div>
            )}

            {/* Hidden file input for folder upload */}
            <input
                type="file"
                ref={folderUploadRef}
                onChange={handleFolderFileSelect}
                className="hidden"
            />

            {/* Hidden directory input for folder upload */}
            <input
                type="file"
                ref={directoryUploadRef}
                onChange={handleDirectoryUpload}
                className="hidden"
                webkitdirectory=""
                directory=""
                multiple
            />

            {/* Directory Upload Progress Modal */}
            {directoryUploadProgress.uploading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Đang tải lên thư mục</h3>
                                <p className="text-sm text-gray-500">"{directoryUploadProgress.folderName}"</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${(directoryUploadProgress.current / directoryUploadProgress.total) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-3">
                            {directoryUploadProgress.current} / {directoryUploadProgress.total} tệp
                        </p>
                    </div>
                </div>
            )}

            {/* Folder Preview Modal */}
            {folderPreview.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[80vh]">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Xem trước: {folderPreview.folderName}
                            </h3>
                            <button onClick={closeFolderPreview} className="text-white/80 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[60vh]">
                            {folderPreview.files.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Thư mục trống</p>
                            ) : (
                                <div className="space-y-2">
                                    {folderPreview.files.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <div>
                                                    <p className="font-medium text-gray-800">{file.fileName}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openFilePreview(file.id, file.fileName, file.fileType)}
                                                    className="px-3 py-1.5 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                                                >
                                                    Xem trước
                                                </button>
                                                <button
                                                    onClick={() => download(file.id, file.fileName)}
                                                    className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                                                >
                                                    Tải xuống
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Share Modal */}
            {folderShareModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Chia sẻ thư mục: {folderShareModal.folderName}
                            </h3>
                            <button onClick={closeFolderShareModal} className="text-white/80 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="email"
                                    placeholder="Nhập email người nhận"
                                    value={folderShareEmailInput}
                                    onChange={(e) => setFolderShareEmailInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addFolderShareEmail()}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={addFolderShareEmail}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                >
                                    Thêm
                                </button>
                            </div>
                            {folderShareEmails.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {folderShareEmails.map((email) => (
                                        <span key={email} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1">
                                            {email}
                                            <button onClick={() => removeFolderShareEmail(email)} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={submitFolderShare}
                                disabled={folderShareEmails.length === 0 || folderShareLoading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl disabled:opacity-50"
                            >
                                {folderShareLoading ? 'Đang chia sẻ...' : `Chia sẻ với ${folderShareEmails.length} người`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {filePreview.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh]">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">{filePreview.fileName}</h3>
                            <button onClick={closeFilePreview} className="text-white/80 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[80vh] flex items-center justify-center bg-gray-100">
                            {filePreview.fileType?.startsWith('image/') && (
                                <img src={filePreview.previewUrl} alt={filePreview.fileName} className="max-w-full max-h-[70vh] object-contain" />
                            )}
                            {filePreview.fileType === 'application/pdf' && (
                                <iframe src={filePreview.previewUrl} className="w-full h-[70vh]" title={filePreview.fileName} />
                            )}
                            {filePreview.fileType?.startsWith('video/') && (
                                <video
                                    src={filePreview.previewUrl}
                                    controls
                                    className="max-w-full max-h-[70vh]"
                                    autoPlay={false}
                                >
                                    Trình duyệt không hỗ trợ video này.
                                </video>
                            )}
                            {filePreview.fileType?.startsWith('audio/') && (
                                <div className="flex flex-col items-center gap-4 p-8">
                                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-700 font-medium">{filePreview.fileName}</p>
                                    <audio
                                        src={filePreview.previewUrl}
                                        controls
                                        className="w-full max-w-md"
                                    >
                                        Trình duyệt không hỗ trợ audio này.
                                    </audio>
                                </div>
                            )}
                            {(filePreview.fileType?.startsWith('text/') ||
                                filePreview.fileType === 'application/json' ||
                                filePreview.fileType === 'application/xml') && (
                                    <iframe
                                        src={filePreview.previewUrl}
                                        className="w-full h-[70vh] bg-white border border-gray-300 rounded"
                                        title={filePreview.fileName}
                                    />
                                )}
                            {/* Word/Excel Document Preview */}
                            {(filePreview.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                filePreview.fileType === 'application/msword' ||
                                filePreview.fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                                filePreview.fileType === 'application/vnd.ms-excel' ||
                                filePreview.fileName?.toLowerCase().endsWith('.docx') ||
                                filePreview.fileName?.toLowerCase().endsWith('.doc') ||
                                filePreview.fileName?.toLowerCase().endsWith('.xlsx') ||
                                filePreview.fileName?.toLowerCase().endsWith('.xls')) && (
                                    <div className="w-full h-[70vh] overflow-auto bg-white rounded-lg shadow-inner">
                                        {officeContent.loading && (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-gray-600">Đang tải nội dung...</p>
                                                </div>
                                            </div>
                                        )}
                                        {officeContent.error && (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center text-red-500">
                                                    <p>{officeContent.error}</p>
                                                    <a
                                                        href={filePreview.previewUrl}
                                                        download={filePreview.fileName}
                                                        className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    >
                                                        Tải xuống file
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {officeContent.html && (
                                            <div
                                                className="p-6 prose max-w-none office-content"
                                                dangerouslySetInnerHTML={{ __html: officeContent.html }}
                                                style={{
                                                    '--tw-prose-body': '#374151',
                                                    '--tw-prose-headings': '#1f2937'
                                                }}
                                            />
                                        )}
                                        <style>{`
                                        .office-content table {
                                            border-collapse: collapse;
                                            width: 100%;
                                            margin: 1rem 0;
                                        }
                                        .office-content th, .office-content td {
                                            border: 1px solid #e5e7eb;
                                            padding: 8px 12px;
                                            text-align: left;
                                        }
                                        .office-content th {
                                            background-color: #f3f4f6;
                                            font-weight: 600;
                                        }
                                        .office-content tr:nth-child(even) {
                                            background-color: #f9fafb;
                                        }
                                        .office-content .sheet-container {
                                            margin-bottom: 2rem;
                                        }
                                        .office-content .sheet-title {
                                            font-size: 1.125rem;
                                            font-weight: 600;
                                            color: #1f2937;
                                            margin-bottom: 0.5rem;
                                            padding-bottom: 0.5rem;
                                            border-bottom: 2px solid #3b82f6;
                                        }
                                        .office-content p {
                                            margin: 0.5rem 0;
                                        }
                                        .office-content h1, .office-content h2, .office-content h3 {
                                            margin-top: 1rem;
                                            margin-bottom: 0.5rem;
                                        }
                                    `}</style>
                                    </div>
                                )}
                            {/* Fallback for all other file types (PowerPoint, etc.) */}
                            {!filePreview.fileType?.startsWith('image/') &&
                                filePreview.fileType !== 'application/pdf' &&
                                !filePreview.fileType?.startsWith('video/') &&
                                !filePreview.fileType?.startsWith('audio/') &&
                                !filePreview.fileType?.startsWith('text/') &&
                                filePreview.fileType !== 'application/json' &&
                                filePreview.fileType !== 'application/xml' &&
                                filePreview.fileType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
                                filePreview.fileType !== 'application/msword' &&
                                filePreview.fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
                                filePreview.fileType !== 'application/vnd.ms-excel' &&
                                !filePreview.fileName?.toLowerCase().endsWith('.docx') &&
                                !filePreview.fileName?.toLowerCase().endsWith('.doc') &&
                                !filePreview.fileName?.toLowerCase().endsWith('.xlsx') &&
                                !filePreview.fileName?.toLowerCase().endsWith('.xls') && (
                                    <div className="flex flex-col items-center gap-6 p-8 text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800">{filePreview.fileName}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{filePreview.fileType}</p>
                                        </div>
                                        <p className="text-gray-600 max-w-md">
                                            Loại file này không thể xem trước trực tiếp trong trình duyệt.
                                        </p>
                                        <a
                                            href={filePreview.previewUrl}
                                            download={filePreview.fileName}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                            📥 Tải xuống để xem
                                        </a>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
