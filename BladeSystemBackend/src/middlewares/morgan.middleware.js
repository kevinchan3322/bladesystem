const morgan = require('morgan');
const logger = require('../utils/logger');

const stream = {
    // Use the http severity
    write: (message) => logger.http(message),
};

const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

// 用請求的真實 IP 替代掉上游 IP
morgan.token('remote-addr', (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const remoteAddr = forwarded.split(',')[0];
        return remoteAddr;
    }
    return req.connection.remoteAddress;
});

const morganMiddleware = morgan(
    // Define message format string (this is the default one).
    // The message format is made from tokens, and each token is
    // defined inside the Morgan library.
    // You can create your custom token to show what do you want from a request.
    ':remote-addr :method :url :status :res[content-length] - :response-time ms',
    // Options: in this case, I overwrote the stream and the skip logic.
    // See the methods above.
    { stream, skip }
);

module.exports = morganMiddleware;
