const express = require("express");
const router = express.Router();
const { uploadSingle, uploadMultiple, uploadFile,uploadMultipleFiles } = require("../controllers/uploadController");

// Route: POST /api/upload/single - For single file upload
router.post("/upload/single", uploadSingle, uploadFile);

// Route: POST /api/upload/multiple - For multiple file uploads (up to 10 files)
router.post("/upload/multiple", uploadMultiple, uploadMultipleFiles);

module.exports = router;