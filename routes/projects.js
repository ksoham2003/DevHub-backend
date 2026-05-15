const router = require('express').Router();
const { createProject, getProjects, getProject, updateProject, deleteProject, toggleLike } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
router.route('/').get(getProjects).post(protect, createProject);
router.route('/:id').get(getProject).put(protect, updateProject).delete(protect, deleteProject);
router.post('/:id/like', protect, toggleLike);
module.exports = router;
