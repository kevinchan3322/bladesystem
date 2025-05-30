const mongoose = require('mongoose');

const MachiningTaskSpecificationSchema = new mongoose.Schema(
    {
        物料號碼: String,
        加工部位: String,
        加工任務: String,
        '下刀工時 (秒)': String,
        刀片規格: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const MachiningTaskSpecificationModel = mongoose.model(
    'MachiningTaskSpecification',
    MachiningTaskSpecificationSchema,
    'MachiningTaskSpecifications'
);

module.exports = { MachiningTaskSpecificationModel };
