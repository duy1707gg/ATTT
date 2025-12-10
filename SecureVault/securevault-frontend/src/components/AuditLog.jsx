import React, { useState, useEffect } from "react";
import AuditService from "../services/audit.service";

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fixing, setFixing] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = () => {
        setLoading(true);
        AuditService.getAuditLogs().then(
            (response) => {
                setLogs(response.data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading logs", error);
                setLoading(false);
            }
        );
    };

    const verifyBlockchain = () => {
        AuditService.verifyChainWithDetails().then(
            (response) => {
                setVerificationResult(response.data);
            },
            (error) => {
                setVerificationResult({ valid: false, message: "Error verifying blockchain" });
            }
        );
    };

    const fixTamperedBlock = (blockIndex) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa block #${blockIndex} và tất cả block sau đó?\n\nĐây là thao tác không thể hoàn tác!`)) {
            setFixing(true);
            AuditService.fixTamperedBlock(blockIndex).then(
                (response) => {
                    alert(response.data.message);
                    setVerificationResult(null);
                    loadLogs();
                    setFixing(false);
                },
                (error) => {
                    alert("Lỗi khi khắc phục: " + (error.response?.data?.message || error.message));
                    setFixing(false);
                }
            );
        }
    };

    const rebuildBlockchain = () => {
        if (window.confirm("⚠️ CẢNH BÁO: Bạn sắp xây dựng lại TOÀN BỘ Blockchain!\n\nTất cả log hiện tại sẽ bị XÓA VĨNH VIỄN.\nChỉ Genesis Block mới sẽ được tạo.\n\nBạn có chắc chắn muốn tiếp tục?")) {
            setFixing(true);
            AuditService.rebuildBlockchain().then(
                (response) => {
                    alert(response.data.message);
                    setVerificationResult(null);
                    loadLogs();
                    setFixing(false);
                },
                (error) => {
                    alert("Lỗi khi xây dựng lại: " + (error.response?.data?.message || error.message));
                    setFixing(false);
                }
            );
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8 border border-gray-100 mt-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            Nhật ký hệ thống (Blockchain)
                        </h3>
                        <p className="text-sm text-gray-500">Tổng cộng: {logs.length} bản ghi</p>
                    </div>
                </div>
                <button
                    onClick={verifyBlockchain}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Kiểm tra toàn vẹn
                </button>
            </div>

            {/* Verification Result */}
            {verificationResult && (
                <div className={`mb-6 p-4 rounded-xl ${verificationResult.valid
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200"
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{verificationResult.valid ? "✅" : "⚠️"}</span>
                        <span className={`font-bold text-lg ${verificationResult.valid ? "text-emerald-700" : "text-red-700"}`}>
                            {verificationResult.valid
                                ? "Blockchain HỢP LỆ - Dữ liệu không bị giả mạo"
                                : "Blockchain KHÔNG HỢP LỆ - Có dấu hiệu giả mạo!"}
                        </span>
                    </div>

                    {/* Tampered Blocks Details */}
                    {!verificationResult.valid && verificationResult.tamperedBlocks && verificationResult.tamperedBlocks.length > 0 && (
                        <div className="mt-4 space-y-4">
                            <h4 className="font-semibold text-red-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Chi tiết các block bị giả mạo ({verificationResult.tamperedCount} block):
                            </h4>

                            {verificationResult.tamperedBlocks.map((block, index) => (
                                <div key={index} className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-bold text-sm">
                                                Block #{block.blockIndex}
                                            </span>
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                                                {block.type === "DATA_MODIFIED" ? "Dữ liệu bị sửa" : "Liên kết chuỗi bị phá"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => fixTamperedBlock(block.blockIndex)}
                                            disabled={fixing}
                                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-red-200 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {fixing ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Xóa & Khắc phục
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-600">
                                            <span className="font-medium text-gray-700">Mô tả:</span> {block.description}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-medium text-gray-700">Dữ liệu hiện tại:</span>{" "}
                                            <code className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">{block.currentData}</code>
                                        </p>
                                        {block.storedHash && (
                                            <p className="text-gray-600">
                                                <span className="font-medium text-gray-700">Hash đã lưu:</span>{" "}
                                                <code className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-xs">{block.storedHash.substring(0, 30)}...</code>
                                            </p>
                                        )}
                                        {block.recalculatedHash && (
                                            <p className="text-gray-600">
                                                <span className="font-medium text-gray-700">Hash tính lại:</span>{" "}
                                                <code className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-mono text-xs">{block.recalculatedHash.substring(0, 30)}...</code>
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                        <p className="text-amber-800 text-sm flex items-start gap-2">
                                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                                <strong>Cách khắc phục:</strong> Nhấn "Xóa & Khắc phục" để xóa block bị giả mạo và tất cả các block sau đó.
                                                Hệ thống sẽ giữ lại các block hợp lệ trước block này. Lưu ý: Các log từ block này trở đi sẽ bị mất.
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Rebuild All Button - for when all blocks are corrupted */}
                            {verificationResult.tamperedCount > 3 && (
                                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h5 className="font-semibold text-orange-800">Quá nhiều block bị hỏng?</h5>
                                            <p className="text-orange-700 text-sm">Bạn có thể xây dựng lại toàn bộ Blockchain từ đầu.</p>
                                        </div>
                                        <button
                                            onClick={rebuildBlockchain}
                                            disabled={fixing}
                                            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Xây dựng lại Blockchain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">
                    <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-indigo-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p>Đang tải nhật ký...</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
                                <tr>
                                    <th className="py-4 px-4 font-semibold">Chỉ số</th>
                                    <th className="py-4 px-4 font-semibold">Thời gian</th>
                                    <th className="py-4 px-4 font-semibold">Dữ liệu hành động</th>
                                    <th className="py-4 px-4 font-semibold">Mã băm</th>
                                    <th className="py-4 px-4 font-semibold">Mã băm trước</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 divide-y divide-gray-100 font-mono text-xs">
                                {currentLogs.map((block) => (
                                    <tr key={block.index} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-semibold">
                                                #{block.index}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{new Date(block.timestamp).toLocaleString()}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-emerald-600 font-medium">{block.data}</span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-400 truncate max-w-xs" title={block.hash}>
                                            <code className="bg-gray-100 px-2 py-1 rounded">{block.hash.substring(0, 15)}...</code>
                                        </td>
                                        <td className="py-3 px-4 text-gray-400 truncate max-w-xs" title={block.previousHash}>
                                            <code className="bg-gray-100 px-2 py-1 rounded">{block.previousHash.substring(0, 15)}...</code>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-gray-500">
                                Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, logs.length)} / {logs.length} bản ghi
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Trang đầu"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Trang trước"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {getPageNumbers().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Trang sau"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    title="Trang cuối"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLog;
