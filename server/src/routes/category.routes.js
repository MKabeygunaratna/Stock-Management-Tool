const express = require('express');
const roleGuard = require('../middleware/roleGuard');
const { list, create, update, remove } = require('../controllers/category.controller');

const router = express.Router();

router.get('/', list);
router.post('/', roleGuard('ADMIN'), create);
router.put('/:id', roleGuard('ADMIN'), update);
router.delete('/:id', roleGuard('ADMIN'), remove);

module.exports = router;
