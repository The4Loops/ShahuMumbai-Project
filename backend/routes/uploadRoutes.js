const express = require('express');
const router = express.Router();
const { upload, uploadFile } = require('../controllers/uploadController');

// Route: POST /api/upload
router.post('/api/upload', upload.array('files', 10), uploadFile);

module.exports = router;
