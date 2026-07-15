const express = require('express');
const { list, getOne, create, pdf } = require('../controllers/purchase.controller');

const router = express.Router();

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.get('/:id/pdf', pdf);

module.exports = router;
