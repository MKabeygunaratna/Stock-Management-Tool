const express = require('express');
const roleGuard = require('../middleware/roleGuard');
const { list } = require('../controllers/loginLog.controller');

const router = express.Router();

router.use(roleGuard('ADMIN'));
router.get('/', list);

module.exports = router;
