const mongoose = require('mongoose');

const WorkReportingRecordSchema = new mongoose.Schema(
    {
        工單編號: String,
        實際加工數量: String,
        '加工開始時間 (實際）': String,
        '加工完成時間 (實際）': String,
        物料號碼: String,
        加工機台: String,
        加工部位: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const WorkReportingRecordModel = mongoose.model(
    'WorkReportingRecord',
    WorkReportingRecordSchema,
    'WorkReportingRecords'
);

module.exports = { WorkReportingRecordModel };
