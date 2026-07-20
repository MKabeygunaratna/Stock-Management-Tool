const express = require('express');
const roleGuard = require('../middleware/roleGuard');
const { list, summary, monthly, balanceSheet } = require('../controllers/account.controller');

const router = express.Router();

router.use(roleGuard('ADMIN'));
router.get('/invoices', list);
router.get('/summary', summary);
router.get('/monthly', monthly);
router.get('/balance-sheet', balanceSheet);

module.exports = router;
