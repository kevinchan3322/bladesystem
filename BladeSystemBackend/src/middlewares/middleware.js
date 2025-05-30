const { StatusCodes } = require('http-status-codes');

const util = require('../utils/util');
const { LeaveAPIError } = require('../configs/error');
const logger = require('../utils/logger.js');

const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET || 'secret_key_for_jwt';

const { UserModel } = require('../models/user.js');

const authenticateJWT = async (req, res, next) => {
    let results = {};
    let statusCode = StatusCodes.OK;

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                message: 'Authorization Header not exists',
            });
        } else {
            const authArray = authHeader.split(' ');

            if (authArray[0] != 'Bearer') {
                res.status(401).json({
                    message: 'Invalid Authorization Header',
                });
            }

            const token = authArray[1];

            await jwt.verify(token, jwt_secret, async (err, decoded) => {
                if (err) {
                    return res.status(401).json(err);
                } else {
                    const user = await UserModel.findById(decoded.user._id)
                        .select('-password')
                        .lean();

                    if (user) {
                        req.me = user;
                        next();
                        return;
                    } else {
                        return res.status(401).json(err);
                    }
                }
            });
        }
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            logger.error(error.message);

            res.status(statusCode);
            res.json(results);
            return;
        }

        next(error);
    }
};

const sample = async (req, res, next) => {
    let results = {};
    let statusCode = StatusCodes.OK;

    try {
        const siteID = req.body.siteID;
        const siteName = req.body.siteName;
        const levelID = req.body.levelID;
        const levelName = req.body.levelName;
        const floorPlanPath = req.body.floorPlanPath;

        const checkData = [siteID, siteName, levelID, levelName, floorPlanPath];

        if (util.hasUndefinedData(checkData)) {
            throw new LeaveAPIError(
                'please send siteID, siteName, levelID, levelName and floorPlanPath'
            );
        }
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            logger.error(error.message);

            res.status(statusCode);
            res.json(results);
            return;
        }

        next(error);
    }

    next();
};

module.exports = {
    sample,
    authenticateJWT,
};
