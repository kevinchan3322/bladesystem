const mongoose = require('mongoose');

const BladeHolderSpecificationSchema = new mongoose.Schema(
    {
        刀柄編號: String,
        刀柄規格: String,
        刀片規格: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const BladeHolderSpecificationModel = mongoose.model(
    'BladeHolderSpecification',
    BladeHolderSpecificationSchema,
    'BladeHolderSpecifications'
);

module.exports = { BladeHolderSpecificationModel };
