const mongoose = require('mongoose');

const BladeSpecificationSchema = new mongoose.Schema(
    {
        刀片規格: String,
        刀片材質: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const BladeSpecificationModel = mongoose.model(
    'BladeSpecification',
    BladeSpecificationSchema,
    'BladeSpecifications'
);

module.exports = { BladeSpecificationModel };
