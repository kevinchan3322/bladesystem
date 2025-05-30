const express = require('express');
const router = express.Router();

const c = require('../controllers/controller.js');
const authC = require('../controllers/auth.js');
const m = require('../middlewares/middleware.js');

router.post('/sign-up', authC.signUp);
router.post('/sign-in', authC.signIn);

router.get('/health-check', c.healthCheck);
router.get('/test', c.test);

module.exports = router;
