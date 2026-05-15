const router = require('express').Router();
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/:targetType/:targetId', getComments);
router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
