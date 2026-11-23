const router = require('express').Router();
const c = require('../controllers/paymentController');

router.get('/', c.getAll);
router.get('/allocation/:id', c.getByAllocation);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;