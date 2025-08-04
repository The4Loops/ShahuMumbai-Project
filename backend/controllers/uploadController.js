const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');

// Setup storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',  // Cloudinary folder
    resource_type: 'auto'  // auto-detect image/video
  }
});

// Multer Upload Middleware
const upload = multer({ storage: storage });

// Controller Function
const uploadFile = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const imageUrls = req.files.map(file => ({
      originalUrl: file.path,
      transformedUrl: cloudinary.url(file.filename, {
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      }),
    }));

    res.status(200).json({ imageUrls });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

module.exports = {
  upload,
  uploadFile
};
