const mongoose = require('mongoose');

const MachinedPartSpecificationSchema = new mongoose.Schema(
    {
        物料號碼: String,
        加工件材質: String,
        零件類型: String,
        熱處理: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const MachinedPartSpecificationModel = mongoose.model(
    'MachinedPartSpecification',
    MachinedPartSpecificationSchema,
    'MachinedPartSpecifications'
);

module.exports = { MachinedPartSpecificationModel };
