const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { StatusCodes } = require('http-status-codes');

const logger = require('./src/utils/logger');
const r = require('./src/routes/route');
const jwt_r = require('./src/routes/jwt_route.js');
const { authenticateJWT } = require('./src/middlewares/middleware.js');
const morganMiddleware = require('./src/middlewares/morgan.middleware');

var app = express();

app.use(cors());
app.use(morganMiddleware);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use('/', r);
app.use('/', authenticateJWT, jwt_r);

/* Error handler middleware */
app.use((error, req, res, next) => {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    logger.error(error.stack);

    res.status(statusCode).json({ message: error.message });

    return;
});

module.exports = app;
