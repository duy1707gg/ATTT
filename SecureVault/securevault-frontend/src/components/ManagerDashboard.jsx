import React, { useState, useEffect } from "react";
import FileService from "../services/file.service";

const ManagerDashboard = () => {
    const [pendingFiles, setPendingFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingFiles();
    }, []);

    const loadPendingFiles = () => {
        setLoading(true);
        FileService.getPendingFiles().then(
            (response) => {
                setPendingFiles(response.data);
                setLoading(false);
            },
            (error) => {
                setMessage("Lỗi tải danh sách tệp chờ duyệt");
                setLoading(false);
            }
        );
    };

    const handleApproval = (fileId, approved) => {
        FileService.approveFile(fileId, approved).then(
            (response) => {
                setMessage(response.data);
                loadPendingFiles();
            },
            (error) => {
                setMessage("Lỗi cập nhật trạng thái tệp");
            }
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                    Bảng điều khiển Quản lý - Duyệt tệp
                </h3>
            </div>

            {message && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {message}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-emerald-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Đang tải danh sách tệp...</p>
                </div>
            ) : pendingFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Không có tệp nào đang chờ duyệt.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase text-gray-500 bg-gray-50 rounded-lg">
                            <tr>
                                <th className="py-4 px-4 rounded-l-lg font-semibold">Tên tệp</th>
                                <th className="py-4 px-4 font-semibold">Người sở hữu</th>
                                <th className="py-4 px-4 font-semibold">Kích thước</th>
                                <th className="py-4 px-4 font-semibold">Ngày tải lên</th>
                                <th className="py-4 px-4 rounded-r-lg font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 divide-y divide-gray-100">
                            {pendingFiles.map((file) => (
                                <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="py-4 px-4 font-medium text-gray-900">{file.fileName}</td>
                                    <td className="py-4 px-4 text-gray-500">{file.ownerUsername || "Không xác định"}</td>
                                    <td className="py-4 px-4 text-gray-500">{(file.size / 1024).toFixed(2)} KB</td>
                                    <td className="py-4 px-4 text-gray-500">{new Date(file.uploadedAt).toLocaleString()}</td>
                                    <td className="py-4 px-4 flex gap-2">
                                        <button
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200"
                                            onClick={() => handleApproval(file.id, true)}
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-red-200"
                                            onClick={() => handleApproval(file.id, false)}
                                        >
                                            Từ chối
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
