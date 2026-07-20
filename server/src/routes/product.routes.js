const express = require('express');
const roleGuard = require('../middleware/roleGuard');
const { list, lowStock, getOne, create, update, remove } = require('../controllers/product.controller');

const router = express.Router();

router.get('/', list);
router.get('/low-stock', lowStock);
router.get('/:id', getOne);
router.post('/', roleGuard('ADMIN'), create);
router.put('/:id', roleGuard('ADMIN'), update);
router.delete('/:id', roleGuard('ADMIN'), remove);

module.exports = router;
