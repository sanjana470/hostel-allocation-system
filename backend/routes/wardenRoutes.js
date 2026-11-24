const router = require('express').Router();
const c = require('../controllers/wardenController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/', c.getAll);
router.post('/', allowRoles('Admin'), c.create);
router.put('/:id', allowRoles('Admin'), c.update);
router.delete('/:id', allowRoles('Admin'), c.remove);

module.exports = router;