const express = require('express');
const roleGuard = require('../middleware/roleGuard');
const { list, summary } = require('../controllers/account.controller');

const router = express.Router();

router.use(roleGuard('ADMIN'));
router.get('/invoices', list);
router.get('/summary', summary);

module.exports = router;
