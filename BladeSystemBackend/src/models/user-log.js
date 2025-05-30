const mongoose = require('mongoose');

const UserLogSchema = new mongoose.Schema(
    {
        account: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const UserLogModel = mongoose.model('UserLogs', UserLogSchema, 'UserLogs');

module.exports = { UserLogModel };
