const express = require('express');
const { list, listAll, getOne, create, update, remove } = require('../controllers/supplier.controller');

const router = express.Router();

router.get('/', list);
router.get('/all', listAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
