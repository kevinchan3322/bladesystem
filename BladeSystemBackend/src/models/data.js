const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema(
    {
        name: String,
        step: String,
        status: String,
        filename: String,
        messages: Array,
        content: String,
    },
    {
        timestamps: true,
        minimize: false,
    }
);

const Data = mongoose.model('Data', DataSchema, 'Data');

module.exports = { Data };
