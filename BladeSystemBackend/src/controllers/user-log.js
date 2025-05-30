const { StatusCodes } = require('http-status-codes');

const logger = require('../utils/logger.js');
const util = require('../utils/util.js');

const { LeaveAPIError } = require('../configs/error.js');
const actionRef = require('../configs/action.js');

const { UserModel, UserLogModel } = require('../models/db.js');
const { MongoServerError } = require('mongodb');

const getLogs = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    const user = req.me;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    const account = req.query.account || '';
    const action = req.query.action || '';

    try {
        const logQuery = {};
        if (account !== '' && account !== '全部') logQuery.account = account;
        if (action !== '' && action !== '全部') logQuery.action = action;

        const totalItems = await UserLogModel.countDocuments(logQuery);
        const totalPages = Math.ceil(totalItems / limit);
        const logs = await UserLogModel.find(logQuery)
            .skip(skip)
            .limit(limit)
            .sort({
                createdAt: -1,
            });

        results.data.logList = logs;
        results.data.meta = {
            current_page: page,
            total_page: totalPages,
        };
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

const getLogPageOptions = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        const users = await UserModel.find();

        results.data.userList = users.map((user) => user.account);
        let outputList = [];

        for (const key in actionRef) {
            const element = actionRef[key];

            outputList.push(element);
        }
        results.data.actionList = outputList;
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

module.exports = { getLogs, getLogPageOptions };
