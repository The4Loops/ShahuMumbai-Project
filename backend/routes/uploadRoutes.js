const express = require('express');
const router = express.Router();
const { upload, uploadFile } = require('../controllers/uploadController');

// Route: POST /api/upload
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
