const { exec } = require('child_process');
const axios = require('axios');
const util = require('./util.js');

const {
    Data,
    WorkOrderModel,
    WorkReportingRecordModel,
    BladeChangeRecordModel,
    BladeHolderSpecificationModel,
    BladeCompensationRecordModel,
    BladeSpecificationModel,
    MachiningTaskSpecificationModel,
    MachinedPartSpecificationModel,
} = require('../models/db.js');

const bladeFileCheck = async () => {
    return new Promise((resolve, reject) => {
        exec('python hello.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error);
            }
            console.log(`stdout: ${stdout}`);
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            resolve(stdout);
        });
    });
};

const predict = async (names, ndarray) => {
    // TODO
    // return {
    //     predictions: [
    //         { 是否換刀: 'B' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //         { 是否換刀: 'A' },
    //     ],
    // };
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            data: {
                names: names,
                ndarray: ndarray,
            },
        });

        const config = {
            method: 'post',
            url: process.env.BLADE_PREDICT_API,
            headers: {
                // Token: process.env.BLADE_PREDICT_API_TOKEN,
                'Content-Type': 'application/json',
            },
            data: data,
        };

        axios(config)
            .then(function (response) {
                resolve(response.data.jsonData.predictions);
            })
            .catch(function (error) {
                console.log(error);
                reject([]);
            });
    });
};

const getPredictResult = async () => {
    return axios
        .head('https://jsonplaceholder.typicode.com/todos/1')
        .then((response) => {
            return 'success';
            // return 'failed';
        })
        .catch((error) => {
            throw error;
        });
};

const readImportXlsx = async (filename, sheetName) => {
    return new Promise((resolve, reject) => {
        exec(
            `python convert_file_to_json.py ${filename} ${sheetName}`,
            { encoding: 'utf8' },
            async (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    reject(error);
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                }
                resolve(stdout.trim());
            }
        );
    });
};

const workOrderProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for (const record of records) {
        if (
            record['工單編號'] === null ||
            record['加工部位'] === null ||
            record['物料號碼 (零件品號)'] === null
        ) {
            continue;
        }

        await WorkOrderModel.create({
            工單編號: record['工單編號'],
            加工機台: record['加工機台'],
            '工單數量 (加工數量)': record['工單數量 (加工數量)'],
            加工部位: record['加工部位'],
            '物料號碼 (零件品號)': record['物料號碼 (零件品號)'],
            '開始時間 (工單計畫)': util.formatDateWithTimezone(
                record['開始時間 (工單計畫)']
            ),
            '結束時間 (工單計畫)': util.formatDateWithTimezone(
                record['結束時間 (工單計畫)']
            ),
            tag: tag,
        });
    }
};

const workReportingRecordsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (
            record['工單編號'] === null ||
            record['物料號碼'] === null ||
            record['加工機台'] === null ||
            record['加工部位'] === null
        ) {
            continue;
        }

        await WorkReportingRecordModel.create({
            工單編號: record['工單編號'],
            實際加工數量: record['實際加工數量'],
            '加工開始時間 (實際）': util.formatDateWithTimezone(
                record['加工開始時間 (實際）']
            ),
            '加工完成時間 (實際）': util.formatDateWithTimezone(
                record['加工完成時間 (實際）']
            ),
            物料號碼: record['物料號碼'],
            加工機台: record['加工機台'],
            加工部位: record['加工部位'],
            tag: tag,
        });
    }
};

const bladeChangeRecordsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (
            record['刀片規格'] === null ||
            record['刀柄編號'] === null ||
            record['機台'] === null
        ) {
            continue;
        }

        await BladeChangeRecordModel.create({
            狀態: record['狀態'],
            刀片編號: record['刀片編號'],
            刀片規格: record['刀片規格'],
            刀柄編號: record['刀柄編號'],
            時間: util.formatDateWithTimezone(record['時間']),
            機台: record['機台'],
            tag: tag,
        });
    }
};

const bladeHolderSpecificationsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (record['刀柄編號'] === null || record['刀片規格'] === null) {
            continue;
        }

        await BladeHolderSpecificationModel.create({
            刀柄編號: record['刀柄編號'],
            刀柄規格: record['刀柄規格'],
            刀片規格: record['刀片規格'],
            tag: tag,
        });
    }
};

const bladeCompensationRecordsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (
            record['工作中心 (加工機台)'] === null ||
            record['刀片規格'] === null ||
            record['刀柄編號'] === null
        ) {
            continue;
        }
        await BladeCompensationRecordModel.create({
            刀片編號: record['刀片編號'],
            補刀時間: util.formatDateWithTimezone(record['補刀時間']),
            '補刀長度(mm)': record['補刀長度(mm)'],
            '工作中心 (加工機台)': record['工作中心 (加工機台)'],
            刀片規格: record['刀片規格'],
            刀柄編號: record['刀柄編號'],
            tag: tag,
        });
    }
};

const bladeSpecificationsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (record['刀片規格'] === null) {
            continue;
        }

        await BladeSpecificationModel.create({
            刀片材質: record['刀片材質'],
            刀片規格: record['刀片規格'],
            tag: tag,
        });
    }
};

const machiningTaskSpecificationsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (
            record['物料號碼'] === null ||
            record['加工部位'] === null ||
            record['加工任務'] === null ||
            record['刀片規格'] === null
        ) {
            continue;
        }

        await MachiningTaskSpecificationModel.create({
            物料號碼: record['物料號碼'],
            加工部位: record['加工部位'],
            加工任務: record['加工任務'],
            '下刀工時 (秒)': record['下刀工時 (秒)'],
            刀片規格: record['刀片規格'],
            tag: tag,
        });
    }
};

const machinedPartSpecificationsProcess = async (filename, sheetName, tag) => {
    const xlsxStr = await readImportXlsx(filename, sheetName);
    const records = JSON.parse(xlsxStr);

    for await (const record of records) {
        if (record['物料號碼'] === null) {
            continue;
        }

        await MachinedPartSpecificationModel.create({
            物料號碼: record['物料號碼'],
            加工件材質: record['加工件材質'],
            零件類型: record['零件類型'],
            熱處理: record['熱處理'],
            tag: tag,
        });
    }
};

const insertBladeData = async (filename) => {
    const tag = new Date().getTime();

    // 更新 tag
    await Data.findOneAndUpdate(
        { name: 'latest-upload-tag' },
        { content: tag },
        {
            new: true,
            upsert: true,
            runValidators: true,
        }
    );

    await workOrderProcess(filename, '工單', tag);
    await workReportingRecordsProcess(filename, '報工紀錄', tag);
    await bladeChangeRecordsProcess(filename, '換刀紀錄', tag);
    await bladeHolderSpecificationsProcess(filename, '刀柄規格', tag);
    await bladeCompensationRecordsProcess(filename, '補刀紀錄', tag);
    await bladeSpecificationsProcess(filename, '刀片規格', tag);
    await machiningTaskSpecificationsProcess(filename, '加工任務規格', tag);
    await machinedPartSpecificationsProcess(filename, '加工零件規格', tag);

    return tag;
};

module.exports = {
    bladeFileCheck,
    predict,
    getPredictResult,
    insertBladeData,
    readImportXlsx,
};
