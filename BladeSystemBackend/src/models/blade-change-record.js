const mongoose = require('mongoose');

const BladeChangeRecordSchema = new mongoose.Schema(
    {
        狀態: String,
        刀片編號: String,
        刀片規格: String,
        刀柄編號: String,
        時間: String,
        機台: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const BladeChangeRecordModel = mongoose.model(
    'BladeChangeRecord',
    BladeChangeRecordSchema,
    'BladeChangeRecords'
);

module.exports = { BladeChangeRecordModel };
