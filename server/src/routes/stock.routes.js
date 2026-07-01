const express = require('express');
const { stockIn, stockOut, history } = require('../controllers/stock.controller');

const router = express.Router();

router.post('/in', stockIn);
router.post('/out', stockOut);
router.get('/history', history);

module.exports = router;
