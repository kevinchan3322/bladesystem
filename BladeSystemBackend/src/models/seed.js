const { Data } = require('./data');

const createPredictionData = () => {
    Data.findOne({ name: 'prediction' }).then((prediction) => {
        if (!prediction) {
            console.log('init prediction data');

            Data.create({
                name: 'prediction',
                step: 'idle',
                status: 'idle',
            });
        }
    });
};

const createLastUploadTagData = () => {
    Data.findOne({ name: 'latest-upload-tag' }).then((tag) => {
        if (!tag) {
            console.log('init latest-upload-tag data');

            Data.create({
                name: 'latest-upload-tag',
                content: '',
            });
        }
    });
};

module.exports = { createPredictionData, createLastUploadTagData };
