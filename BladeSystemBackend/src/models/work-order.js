const mongoose = require('mongoose');

const WorkOrderSchema = new mongoose.Schema(
    {
        工單編號: String,
        加工機台: String,
        '工單數量 (加工數量)': String,
        加工部位: String,
        '物料號碼 (零件品號)': String,
        '開始時間 (工單計畫)': String,
        '結束時間 (工單計畫)': String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const WorkOrderModel = mongoose.model(
    'WorkOrder',
    WorkOrderSchema,
    'WorkOrders'
);

module.exports = { WorkOrderModel };
