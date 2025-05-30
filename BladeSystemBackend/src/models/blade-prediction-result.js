const mongoose = require('mongoose');

const BladePredictionResultSchema = new mongoose.Schema(
    {
        機台: String,
        狀態: String,
        刀片編號: String,
        刀片規格: String,
        刀柄編號: String,
        刀片狀態: String,
        needChangeBlade: Boolean,
        alertCycle: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const BladePredictionResultModel = mongoose.model(
    'BladePredictionResult',
    BladePredictionResultSchema,
    'BladePredictionResults'
);

module.exports = { BladePredictionResultModel };
