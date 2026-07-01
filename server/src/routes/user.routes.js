const express = require('express');
const roleGuard = require('../middleware/roleGuard');
const { list, create, update, remove } = require('../controllers/user.controller');

const router = express.Router();

router.use(roleGuard('ADMIN'));
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
