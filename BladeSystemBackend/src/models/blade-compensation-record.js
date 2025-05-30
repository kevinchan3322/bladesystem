const mongoose = require('mongoose');

const BladeCompensationRecordSchema = new mongoose.Schema(
    {
        刀片編號: String,
        補刀時間: String,
        '補刀長度(mm)': String,
        '工作中心 (加工機台)': String,
        刀片規格: String,
        刀柄編號: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const BladeCompensationRecordModel = mongoose.model(
    'BladeCompensationRecord',
    BladeCompensationRecordSchema,
    'BladeCompensationRecords'
);

module.exports = { BladeCompensationRecordModel };
