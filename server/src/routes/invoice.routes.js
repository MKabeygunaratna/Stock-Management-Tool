const express = require('express');
const { list, getOne, pdf } = require('../controllers/invoice.controller');

const router = express.Router();

router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/pdf', pdf);

module.exports = router;
