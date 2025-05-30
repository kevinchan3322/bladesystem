const { StatusCodes } = require('http-status-codes');

const logger = require('../utils/logger.js');
const util = require('../utils/util.js');

const { LeaveAPIError } = require('../configs/error.js');
const Joi = require('joi');
const busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const { Data } = require('../models/data.js');

const downloadFile = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        let filename = 'check-Icon.svg';
        let filePath = path.join(__dirname, filename);

        // Check if file exists
        if (fs.existsSync(filePath)) {
            res.download(filePath, filename, (err) => {
                if (err) {
                    res.status(500).send('Error downloading the file.');
                }
            });
        } else {
            res.status(404).send('File not found.');
        }
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            res.status(statusCode);
            res.json(results);
        } else {
            next(error);
        }

        return;
    }
};

const uploadFile = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        const bb = busboy({ headers: req.headers });

        bb.on('file', (name, file, info) => {
            let saveTo = path.join(__dirname, info.filename);
            file.pipe(fs.createWriteStream(saveTo));
        });

        bb.on('finish', () => {
            res.writeHead(200, { Connection: 'close' });
            res.end('File upload complete');
        });
        return req.pipe(bb);
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            res.status(statusCode);
            res.json(results);
        } else {
            next(error);
        }

        return;
    }
};

const healthCheck = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            res.status(statusCode);
            res.json(results);
        } else {
            next(error);
        }

        return;
    }

    res.status(statusCode);
    res.json(results);
};

const test = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    const data = req.body;

    try {
        const r = await Data.find();

        results.data = r;
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            res.status(statusCode);
            res.json(results);
        } else {
            next(error);
        }

        return;
    }

    res.status(statusCode);
    res.json(results);
};

module.exports = {
    downloadFile,
    uploadFile,

    healthCheck,
    test,
};
