const mongoose = require('mongoose');

const BladePredictionFeedbackSchema = new mongoose.Schema(
    {
        刀片規格: String,
        刀柄編號: String,
        機台: String,
        statusFrom: Boolean,
        statusTo: Boolean,
        skip_cycle: Number,
        expireTime: String,
        tag: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const BladePredictionFeedbackModel = mongoose.model(
    'BladePredictionFeedback',
    BladePredictionFeedbackSchema,
    'BladePredictionFeedbacks'
);

module.exports = { BladePredictionFeedbackModel };
