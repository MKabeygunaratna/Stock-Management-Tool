const express = require('express');
const auth = require('../middleware/auth');
const { login, refresh, logout, me } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', auth, me);

module.exports = router;
