const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

router.post("/banners", bannerController.createBanner);
router.get("/banners", bannerController.getAllBanners);

module.exports = router;