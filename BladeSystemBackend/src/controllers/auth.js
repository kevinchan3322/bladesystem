const { StatusCodes } = require('http-status-codes');
const { OAuth2Client } = require('google-auth-library');
const logger = require('../utils/logger.js');
const util = require('../utils/util.js');
const { LeaveAPIError } = require('../configs/error.js');
const actionRef = require('../configs/action');
const { UserModel, UserLogModel } = require('../models/db.js');
const { MongoServerError } = require('mongodb');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const jwt_secret = process.env.JWT_SECRET || 'secret_key_for_jwt';
const jwt_ttl = process.env.JWT_TTL || 'undefined';
const googleClientId = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(googleClientId);

const googleSignIn = async (req, res, next) => {
  let results = {
    message: 'success',
    data: {},
  };
  let statusCode = StatusCodes.OK;

  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Find or create user
    let user = await UserModel.findOne({ email: email });
    
    if (!user) {
      // Create new user with Google credentials
      user = await UserModel.create({
        account: name,
        email: email,
        googleId: googleId,
        isGoogleUser: true
      });
    }

    // Generate JWT token
    const body = { _id: user._id };
    const options = {};
    if (Number.isInteger(Number(jwt_ttl))) {
      options.expiresIn = jwt_ttl + 's';
    }
    const authToken = jwt.sign({ user: body }, jwt_secret, options);

    results.data.token = authToken;

    await UserLogModel.create({
      account: user.account,
      action: actionRef.SIGN_IN,
    });

  } catch (error) {
    console.error('Google Sign In Error:', error);
    if (error instanceof LeaveAPIError) {
      statusCode = StatusCodes.BAD_REQUEST;
      results.message = error.message;
    } else {
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      results.message = 'Google authentication failed';
    }
    
    res.status(statusCode);
    res.json(results);
    return;
  }

  res.status(statusCode);
  res.json(results);
};

const signUp = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.CREATED;

    const account = req.body.account;
    const password = req.body.password;
    try {
        if (password.length < 8) {
            results.message = 'Password is too short, a least 8 characters';
            throw new LeaveAPIError(
                'Password is too short, a least 8 characters'
            );
        }
        const user = await UserModel.create({ account, password });
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            res.status(statusCode);
            res.json(results);
        } else if (error instanceof MongoServerError) {
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

const signIn = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.CREATED;

    const account = req.body.account;
    const password = req.body.password;
    try {
        const user = await UserModel.findOne({ account: account });

        if (!user) {
            results.message = 'User not found';
            throw new LeaveAPIError('User not found');
        }

        const validate = await user.isValidPassword(password);

        if (!validate) {
            results.message = 'Wrong Password';
            throw new LeaveAPIError('Wrong Password');
        }

        const body = { _id: user._id };
        const options = {};
        if (Number.isInteger(Number(jwt_ttl))) {
            options.expiresIn = jwt_ttl + 's';
        }
        const token = jwt.sign({ user: body }, jwt_secret, options);

        results.data.token = token;

        await UserLogModel.create({
            account: account,
            action: actionRef.SIGN_IN,
        });
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            res.status(statusCode);
            res.json(results);
        } else if (error instanceof MongoServerError) {
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

const editUserPwd = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    const me = req.me;
    const userID = me._id;

    const oldPassword = req.body.old_password;
    const newPassword = req.body.new_password;

    try {
        if (oldPassword === undefined || newPassword === undefined) {
            results.message = 'Invalid Parameter';
            throw new LeaveAPIError('Invalid Parameter');
        }

        if (oldPassword === newPassword) {
            results.message =
                'The new password cannot be the same as the old one.';
            throw new LeaveAPIError(
                'The new password cannot be the same as the old one.'
            );
        }
        const user = await UserModel.findById(userID);

        if (!user) {
            results.message = 'User not Found.';
            throw new LeaveAPIError('User not Found.');
        }

        if (user.isGoogleUser) {
            results.message = 'Google users cannot change password.';
            throw new LeaveAPIError('Google users cannot change password.');
        }

        const isMatch = await argon2.verify(user.password, oldPassword);

        if (!isMatch) {
            results.message = 'The old password was entered incorrectly.';
            throw new LeaveAPIError(
                'The old password was entered incorrectly.'
            );
        }

        user.password = newPassword;
        await user.save();

        logger.info(`[editUserPwd] ${user.account} change password`);
        await UserLogModel.create({
            account: user.account,
            action: actionRef.EDIT_PWD,
        });
    } catch (error) {
        console.log(error.message);
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
    signUp,
    signIn,
    editUserPwd,
    googleSignIn
};
