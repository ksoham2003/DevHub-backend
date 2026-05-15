const router = require('express').Router();
const { getUserProfile, updateProfile, toggleFollow, getFollowers, getFollowing, getUsers } = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', getUsers);
router.put('/profile', protect, updateProfile);
router.get('/:username', optionalAuth, getUserProfile);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
