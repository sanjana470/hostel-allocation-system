const router = require('express').Router();
const c = require('../controllers/allocationController');

router.get('/', c.getActive);
router.get('/history', c.getHistory);
router.get('/student/:id', c.getStudentHistory);
router.post('/', c.allocate);
router.post('/deallocate', c.deallocate);
router.post('/transfer', c.transfer);
router.delete('/:id', c.remove);

module.exports = router;