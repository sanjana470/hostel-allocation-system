const router = require('express').Router();
const c = require('../controllers/roomController');

router.get('/', c.getAll);
router.get('/vacant', c.getVacant);
router.post('/', c.create);
router.patch('/:id/status', c.updateStatus);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;