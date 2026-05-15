const router = require('express').Router();
const { createBlog, getBlogs, getBlogBySlug, updateBlog, deleteBlog, toggleLike, getMyBlogs } = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
router.get('/my', protect, getMyBlogs);
router.route('/').get(getBlogs).post(protect, createBlog);
router.get('/:slug', getBlogBySlug);
router.route('/edit/:id').put(protect, updateBlog).delete(protect, deleteBlog);
router.post('/:id/like', protect, toggleLike);
module.exports = router;
