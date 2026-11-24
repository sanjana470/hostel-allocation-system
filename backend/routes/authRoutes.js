const router = require('express').Router();
const c = require('../controllers/authController');

router.post('/login', c.login);
router.post('/signup', c.signup);

module.exports = router;