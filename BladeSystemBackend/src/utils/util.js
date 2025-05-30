const crypto = require('crypto');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const generateSalt = (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
};

const generateUUID = () => {
    return crypto.randomUUID();
};

const encryptWithSalt = (data, salt) => {
    return crypto
        .createHash('sha256')
        .update(data + salt)
        .digest('hex');
};

const encryptToSHA256 = (input) => {
    return crypto.createHash('sha256').update(input).digest('hex');
};

/** 檢查是否含 undefined 的資料
 *
 * @param {*} list
 * @returns true 代表含有 undefined
 */
const hasUndefinedData = (list) => {
    return !list.every((element) => element !== undefined);
};

const requestImage = (url) => {
    return new Promise((resolve, reject) => {
        axios
            .get(url, {
                responseType: 'arraybuffer',
            })
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                reject(`startSibituTask: ${error}`);
            });
    });
};

const getFileSize = (url) => {
    return axios
        .head(url)
        .then((response) => {
            const fileSize = response.headers['content-length'];
            return fileSize;
        })
        .catch((error) => {
            console.error('Failed to get file size:', error);
            throw error;
        });
};

const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    return emailRegex.test(email);
};

const downloadPDF = async (url) => {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer',
    });

    return response.data;
};

const sha256Encode = (input) => {
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
};

const AESEncrypt = (content, key) => {
    return CryptoJS.AES.encrypt(content, key).toString();
};

const AESDecrypt = (content, key) => {
    var bytes = CryptoJS.AES.decrypt(content, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};

const convertToNumber = (str) => {
    const floatValue = parseFloat(str);

    if (Number.isInteger(floatValue)) {
        return parseInt(floatValue);
    }

    return floatValue;
};

const formatDateWithTimezone = (dateString, timeZone) => {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timeZone,
    };
    let formattedDate = date
        .toLocaleString('zh-TW', options)
        .replace(/\//g, '-')
        .replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3');

    // 將 24:XX 時間格式轉換為 00:XX
    formattedDate = formattedDate.replace(/24:(\d{2})/, '00:$1');

    return formattedDate;
    // return date
    //     .toLocaleString('zh-TW', options)
    //     .replace(/\//g, '-')
    //     .replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3')
};

/**
 * 找出哪個當下執行時間屬於哪個週期
 * 例如：
 * 2024/03/18 07:58 週期為 2024/03/18 09:00
 * 2024/03/18 09:58 週期為 2024/03/18 09:00
 * 2024/03/18 15:58 週期為 2024/03/18 13:00
 * @param {*} date
 * @returns
 */
const determineCycle = (date) => {
    const cycleHours = [9, 13]; // 一天中的兩個週期時間點
    const threshold = 13; // 判斷週期的標準點
    const inputDate = new Date(date);
    const inputHour = inputDate.getHours();

    // 判斷當前時間是在哪個週期內，或者是下一個週期的開始
    let cycleIndex = inputHour < threshold ? 0 : 1;

    // 設置最終日期和時間
    const finalDate = new Date(inputDate);
    finalDate.setHours(cycleHours[cycleIndex], 0, 0, 0); // 設置小時，分鐘，秒和毫秒為 0

    return formatDateWithTimezone(finalDate);
};

module.exports = {
    generateSalt,
    generateUUID,
    encryptWithSalt,
    encryptToSHA256,
    hasUndefinedData,
    requestImage,
    getFileSize,
    isValidEmail,
    downloadPDF,
    sha256Encode,
    AESEncrypt,
    AESDecrypt,
    convertToNumber,
    formatDateWithTimezone,
    determineCycle,
};
