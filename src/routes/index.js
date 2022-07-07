const express = require('express');
const router = express.Router();
const {
    isLoggedIn
} = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {
    res.render('index');
});

module.exports = router;