const router = require('express').Router();
const { search, getTrending } = require('../controllers/searchController');
router.get('/', search);
router.get('/trending', getTrending);
module.exports = router;
