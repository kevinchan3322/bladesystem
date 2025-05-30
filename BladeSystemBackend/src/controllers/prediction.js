const { StatusCodes } = require('http-status-codes');

const logger = require('../utils/logger.js');
const util = require('../utils/util.js');
const { exec } = require('child_process');
const {
    predict,
    getPredictResult,
    insertBladeData,
} = require('../utils/blade.js');
const { LeaveAPIError } = require('../configs/error.js');

const { readImportXlsx } = require('../utils/blade.js');

const busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const actionRef = require('../configs/action');

const {
    UserLogModel,
    Data,
    BladePredictionResultModel,
    BladePredictionFeedbackModel,
    WorkOrderModel,
    WorkReportingRecordModel,
    BladeChangeRecordModel,
    BladeHolderSpecificationModel,
    BladeCompensationRecordModel,
    BladeSpecificationModel,
    MachiningTaskSpecificationModel,
    MachinedPartSpecificationModel,
} = require('../models/db.js');

const getPredictionStatus = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        const r = await Data.findOne({ name: 'prediction' });

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

const generateCheckMessage = (data) => {
    const output = [];

    for (key in data) {
        const value = data[key];

        if (key === '重複資料與缺失值') {
            for (subKey in value) {
                const subValue = value[subKey];

                if (subValue['缺失值數量'] != 0) {
                    output.push({
                        title: subKey,
                        message: `缺失值數量: ${subValue['缺失值數量']}`,
                    });
                }
            }
        } else {
            for (subKey in value) {
                const subValue = value[subKey];

                if (typeof subValue === 'string') {
                    output.push({
                        title: key + ' ' + subKey,
                        message: subValue.replace('[', '').replace(']', ''),
                    });
                } else if (Array.isArray(subValue)) {
                    output.push({
                        title: subKey,
                        message: subValue.toString(),
                    });
                } else {
                    for (subKey2 in subValue) {
                        const subValue2 = subValue[subKey2];
                        output.push({
                            title: subKey2,
                            message: subValue2.toString(),
                        });
                    }
                }
            }
        }
    }

    return output;
};

const fileCheckResult = async () => {
    return new Promise((resolve, reject) => {
        const filePath = path.join('./docs', 'file_check_result.json');

        // 讀取文件並去除 UTF-8 BOM
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            // 去除 BOM
            if (data.charCodeAt(0) === 0xfeff) {
                data = data.slice(1);
            }
            const jsonData = JSON.parse(data);

            resolve(jsonData);
        });
    });
};

const filePreCheckResult = async () => {
    return new Promise((resolve, reject) => {
        const filePath = path.join('./docs', 'pre_file_check_result.json');

        // 讀取文件並去除 UTF-8 BOM
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            // 去除 BOM
            if (data.charCodeAt(0) === 0xfeff) {
                data = data.slice(1);
            }
            const jsonData = JSON.parse(data);

            resolve(jsonData);
        });
    });
};

const bladeFileCheck = async (filename) => {
    return new Promise(async (resolve, reject) => {
        const filePath = path.join('./docs', 'upload', filename);

        exec(
            `python data_clean.py ${filePath} False`,
            async (error, stdout, stderr) => {
                if (error) {
                    logger.error(`exec error: ${error}`);
                    
                    await Data.findOneAndUpdate(
                        { name: 'prediction' },
                        {
                            step: 'check',
                            status: 'failed',
                            messages: [
                                {
                                    "title": "上傳檔案檢查發生預期外的錯誤，請聯絡開發人員",
                                    "message": '',
                                }
                            ],
                        }
                    );

                    resolve('failed');
                    return;
                }
                if (stderr) {
                    logger.warn(`stderr: ${stderr}`);
                }
                

                const checkResult = await fileCheckResult();
                // TODO 確認後直接刪除這個 if 用下面的 else 就好
                if (filename !== 'test.xlsx') {
                    await Data.findOneAndUpdate(
                        { name: 'prediction' },
                        {
                            step: 'check',
                            status: 'success',
                            messages: [],
                            content: new Date(),
                        }
                    );
                    resolve('success');
                } else {
                    const messages = generateCheckMessage(checkResult);
                    if (messages.length === 0) {
                        await Data.findOneAndUpdate(
                            { name: 'prediction' },
                            {
                                step: 'check',
                                status: 'success',
                                messages: [],
                                content: new Date(),
                            }
                        );

                        resolve('success');
                    } else {
                        await Data.findOneAndUpdate(
                            { name: 'prediction' },
                            {
                                step: 'check',
                                status: 'failed',
                                messages: messages,
                            }
                        );

                        resolve('failed');
                    }
                }
            }
        );
    });
};

const uploadFileAndCheck = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        const prediction = await Data.findOne({ name: 'prediction' });

        if (['idle', 'failed', 'success'].indexOf(prediction.status) < 0) {
            results.message = '程式運行中，請勿重複上傳';
            throw new LeaveAPIError('程式運行中，請勿重複上傳');
        }
        const bb = busboy({ headers: req.headers, defParamCharset: 'utf8' });

        bb.on('file', async (name, file, info) => {
            logger.info(`[uploadFileAndCheck] 上傳檔案中... ${info.filename}`);
            let saveTo = path.join('docs', 'upload', info.filename);

            await UserLogModel.create({
                account: req.me.account,
                action: actionRef.UPLOAD_FILE,
            });

            await Data.findOneAndUpdate(
                { name: 'prediction' },
                { step: 'check', status: 'processing', filename: info.filename }
            );
            file.pipe(fs.createWriteStream(saveTo));
        });

        bb.on('finish', async () => {
            const d = await Data.findOne({ name: 'prediction' });
            logger.info(`[uploadFileAndCheck] 上傳檔案完成... ${d.filename}`);
            const r = await bladeFileCheck(d.filename);

            res.writeHead(200, { Connection: 'close' });
            res.end();
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

const bladePredict = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        const prediction = await Data.findOne({ name: 'prediction' });

        if (['idle', 'failed', 'success'].indexOf(prediction.status) < 0) {
            results.message = '程式運行中，請勿重複執行';
            throw new LeaveAPIError('程式運行中，請勿重複執行');
        }

        const pData = await Data.findOneAndUpdate(
            { name: 'prediction' },
            { step: 'predict', status: 'processing' }
        );

        const names = [];
        const ndarray = [];
        const output = [];

        const xlsxStr = await readImportXlsx('docs/file_check_result.csv');
        const sheetData = JSON.parse(xlsxStr);

        if (!sheetData || sheetData.length === 0) {
            throw new LeaveAPIError('The Prediction Data is empty');
        }

        Object.keys(sheetData[0]).forEach((k) => {
            if (k !== '是否換刀') names.push(k);
        });
        
        const jsonData = await filePreCheckResult();
        const statusList = jsonData.output;


        for (const d of sheetData) {
            const tmpArray = [];

            names.forEach((k) => {
                if (k !== '是否換刀') tmpArray.push(d[k]);
            });

            ndarray.push(tmpArray);

            const tmp = statusList.filter(s => s.position == d["刀片位置"]);
            
            output.push({
                機台: d['機台'],
                刀片規格: d['刀片規格'],
                刀柄編號: d['刀柄編號'],
                刀片狀態: tmp[0].status,
            });
        }

        const predictResults = await predict(names, ndarray);

        if (output.length !== predictResults.length) {
            throw new LeaveAPIError(
                `Predict results is different than expected. ${output.length}: ${predictResults.length}`
            );
        }
        
        for (let index = 0; index < output.length; index++) {
            const element = output[index];
            const predictResult = predictResults[index]['是否換刀'];
            const status = element['刀片狀態'];

            // 下線的刀片不管預測結果如何，都不須換刀
            if (['淘汰', '閒置'].includes(status)){
                element['needChangeBlade'] = false;
            }
            else{
                element['needChangeBlade'] = predictResult == 'B'; // B 代表要換刀，A 代表不用換刀
            }
        }

        if (true) {
            const filePath = path.join('./docs', 'upload', pData.filename);
            const tag = await insertBladeData(filePath);

            logger.info(
                `[bladePredict] ${req.me.account} run prediction, tag: ${tag}`
            );
            await UserLogModel.create({
                account: req.me.account,
                action: actionRef.PREDICT,
            });

            const alertCycle = util.determineCycle(
                util.formatDateWithTimezone(new Date())
            );

            for (d of output) {
                const payload = { ...d, tag: tag, alertCycle: alertCycle };
                await BladePredictionResultModel.create(payload);
            }

            await Data.findOneAndUpdate(
                { name: 'prediction' },
                { step: 'predict', status: 'success' }
            );
        } else {
            await Data.findOneAndUpdate(
                { name: 'prediction' },
                { step: 'predict', status: 'failed' }
            );
            results.message = '運行錯誤' + r;
            throw new LeaveAPIError('運行錯誤' + r);
        }
    } catch (error) {
        if (error instanceof LeaveAPIError) {
            statusCode = StatusCodes.BAD_REQUEST;
            results.message = error.message;

            await Data.findOneAndUpdate(
                { name: 'prediction' },
                { step: 'predict', status: 'failed' }
            );

            res.status(statusCode);
            res.json(results);
        } else {
            await Data.findOneAndUpdate(
                { name: 'prediction' },
                { step: 'predict', status: 'failed' }
            );
            next(error);
        }

        return;
    }

    res.status(statusCode);
    res.json(results);
};

const restPredictStatus = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        await Data.findOneAndUpdate(
            { name: 'prediction' },
            { step: 'predict', status: 'idle' }
        );
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

const getPredictionResult = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    const output = [];

    try {
        const d = await Data.findOne({ name: 'latest-upload-tag' });
        const predictResults = await BladePredictionResultModel.find({
            tag: d.content,
        });

        for await (const r of predictResults) {
            const query = {
                刀片規格: r['刀片規格'],
                刀柄編號: r['刀柄編號'],
                機台: r['機台'],
            };

            // 原本是不須換刀的只檢查相同 tag
            if (r['needChangeBlade'] === false) query['tag'] = r['tag'];

            const feedback = await BladePredictionFeedbackModel.findOne(
                query
            ).sort({ createdAt: -1 });

            const rObj = r.toObject();

            if (feedback !== null) {
                // alertCycle 要超過 expireTime 才算到期
                if (
                    r['needChangeBlade'] === true &&
                    r.alertCycle > feedback.expireTime
                ) {
                    // pass
                } else {
                    rObj.feedback = feedback;
                }
            }

            output.push(rObj);
        }
        results.data = output;
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

const addPredictionFeedback = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    const data = req.body; // 資料由前端 API 帶入，statusFrom、statusTo、skip_cycle、expireTime
    const query = {
        刀片規格: data['刀片規格'],
        刀柄編號: data['刀柄編號'],
        機台: data['機台'],
        tag: data['tag'],
    };

    try {
        await UserLogModel.create({
            account: req.me.account,
            action: actionRef.FEEDBACK,
        });
        await BladePredictionFeedbackModel.findOneAndUpdate(query, data, {
            new: true,
            upsert: true,
            runValidators: true,
        });
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

const getPredictionCycle = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    try {
        const d = await Data.findOne({ name: 'latest-upload-tag' });
        const predictionResult = await BladePredictionResultModel.findOne({
            tag: d.content,
        });

        results.data.cycle_date = predictionResult.updatedAt;
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

const getImportData = async (req, res, next) => {
    let results = {
        message: 'success',
        data: {},
    };
    let statusCode = StatusCodes.OK;

    const user = req.me;
    const name = req.query.name;

    const dbRef = {
        工單: WorkOrderModel,
        報工紀錄: WorkReportingRecordModel,
        換刀紀錄: BladeChangeRecordModel,
        刀柄規格: BladeHolderSpecificationModel,
        補刀紀錄: BladeCompensationRecordModel,
        刀片規格: BladeSpecificationModel,
        加工任務規格: MachiningTaskSpecificationModel,
        加工零件規格: MachinedPartSpecificationModel,
    };

    try {
        const d = await Data.findOne({ name: 'latest-upload-tag' });
        const predictionResults = await dbRef[name].find({
            tag: d.content,
        });

        const tmpObjs = predictionResults.map((p) => {
            const t = p.toObject();

            delete t._id;
            delete t.tag;
            delete t.createdAt;
            delete t.updatedAt;
            delete t.__v;

            return t;
        });

        logger.info(`[getImportData] ${user.account} download ${name}`);

        // 前端會 call 這支 API 取得資料後下載，藉此儲存紀錄
        await UserLogModel.create({
            account: user.account,
            action: actionRef.DOWNLOAD_FILE,
        });
        results.data = tmpObjs;
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
    getPredictionStatus,
    uploadFileAndCheck,
    bladePredict,
    getPredictionResult,
    addPredictionFeedback,
    getPredictionCycle,
    getImportData,
    restPredictStatus,
};
