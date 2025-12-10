import api from "./api";

const getAuditLogs = () => {
    return api.get("/audit/logs");
};

const verifyChain = () => {
    return api.get("/audit/verify");
};

const verifyChainWithDetails = () => {
    return api.get("/audit/verify-details");
};

const fixTamperedBlock = (blockIndex) => {
    return api.delete(`/audit/fix/${blockIndex}`);
};

const rebuildBlockchain = () => {
    return api.post("/audit/rebuild");
};

const AuditService = {
    getAuditLogs,
    verifyChain,
    verifyChainWithDetails,
    fixTamperedBlock,
    rebuildBlockchain,
};

export default AuditService;
