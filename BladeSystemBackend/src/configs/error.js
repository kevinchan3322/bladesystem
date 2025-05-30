/**
 * 用來離開 API try catch 用的物件
 */
class LeaveAPIError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LeaveAPIError';
    }
}

module.exports = {
    LeaveAPIError,
};
