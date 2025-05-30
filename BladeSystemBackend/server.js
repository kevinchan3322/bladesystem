require('dotenv').config(); // 最一開始的時候就要讀 .env

const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');

// const db = require('./src/models/db');
const app = require('./app.js');
const logger = require('./src/utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'localhost';
const MONGODB_PORT = process.env.MONGODB_PORT || '27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'local';
const MONGODB_USER = process.env.MONGODB_USER || '';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || '';

if (MONGODB_USER && MONGODB_PASSWORD) {
    mongoose.connect(
        `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_URI}:${MONGODB_PORT}/${MONGODB_DB_NAME}`,
        {
            authSource: 'admin', // or your authentication database
            dbName: MONGODB_DB_NAME,
            authMechanism: 'DEFAULT',
        }
    );
} else {
    mongoose.connect(`mongodb://${MONGODB_URI}:${MONGODB_PORT}`, {
        dbName: MONGODB_DB_NAME,
        authMechanism: 'DEFAULT',
        serverSelectionTimeoutMS: 30 * 1000,
    });
}

const db = mongoose.connection;

///與資料庫連線發生錯誤時
db.on('err', (err) => console.log(err));

///與資料庫連線成功連線時
db.once('open', async () => {
    console.log('connected to database');

    const dbSeed = require('./src/models/seed');
    await dbSeed.createPredictionData();
    await dbSeed.createLastUploadTagData();
});

// 避免 Error handler middleware 接收不到錯誤訊息導致 crash
process.on('uncaughtException', (error, origin) => {
    logger.error('----- Uncaught exception -----');
    logger.error(error.stack);
    logger.error('----- Exception origin -----');
    logger.error(origin);

    try {
        var killTimer = setTimeout(() => {
            process.exit(1);
        }, 3000);
        killTimer.unref();
        notification.sendSlackNotifications('API Server shutdown...');
    } catch (e) {
        logger.error('error when exit', e.stack);
    }
});

process.on('unhandledRejection', (error) => {
    logger.error('Uncaughted Exception happens!');
    // 記錄錯誤下來，等到所有其他服務處理完成，然後停掉當前進程。
    logger.error(error.stack);
});

if (process.env.PRODUCTION_ENV === 'true') {
    https
        .createServer(
            {
                key: fs.readFileSync('./src/ssl/private.key'),
                cert: fs.readFileSync('./src/ssl/certificate.crt'),
            },
            app
        )
        .listen(4000, function () {
            notification.sendSlackNotifications('API Server start...');
            logger.info(`listening on https://localhost:4000/`);
        });
} else {
    app.listen(4000, function () {
        // notification.sendSlackNotifications('API Server start...');
        logger.info(`listening on http://localhost:4000/`);
    });
}
