const express = require('express');
const router = express.Router();

const c = require('../controllers/controller.js');
const authC = require('../controllers/auth.js');
const userLogC = require('../controllers/user-log.js');
const predictionC = require('../controllers/prediction.js');
const m = require('../middlewares/middleware.js');

router.post('/auth/google', authC.googleSignIn); // Google OAuth sign in
router.get('/user/logs', userLogC.getLogs); // 取得帳號操作 Log 紀錄
router.get('/log/option-list', userLogC.getLogPageOptions); // 取得 Log 查詢頁面選項

router.get('/prediction', predictionC.getPredictionResult); // 取得刀片預測結果
router.get('/prediction/data', predictionC.getImportData); //取得本次進行預測的資料，需要帶入 name 進行查詢
router.get('/prediction/status', predictionC.getPredictionStatus); // 取得目前預測進行狀態
router.get('/prediction/cycle', predictionC.getPredictionCycle); // 取得當前執行週期
router.post('/user/password', authC.editUserPwd); // 更改密碼
router.post('/prediction/upload-check', predictionC.uploadFileAndCheck); // 上傳預測用的檔案
router.post('/prediction/predict', predictionC.bladePredict); // 進行刀片預測
router.post('/prediction/reset', predictionC.restPredictStatus); // 當預測完成為了復原前端的狀態
router.post('/prediction/feedback', predictionC.addPredictionFeedback); // 新增修正回饋紀錄

module.exports = router;
