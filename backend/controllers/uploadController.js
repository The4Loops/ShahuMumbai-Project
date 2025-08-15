const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");

// Setup storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Uploads", // Cloudinary folder
    resource_type: "auto", // auto-detect image/video
  },
});

// Multer Upload Middleware
const uploadSingle = multer({ storage: storage }).single("image");
const uploadMultiple = multer({ storage: storage }).array("images", 10); // Max 10 files

// Controller Functions
const uploadFile = (req, res) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let responseData;
    if (req.file) {
      // Single file upload
      const imageUrl = cloudinary.url(req.file.filename, {
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      });
      responseData = { url: imageUrl }; // Match frontend expectation
    } else if (req.files) {
      // Multiple file upload
      const imageUrls = req.files.map((file) =>
        cloudinary.url(file.filename, {
          transformation: [
            { width: 1000, crop: "scale" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        })
      );
      responseData = { imageUrls };
    }

    res.status(200).json(responseData);
  } catch (error) {
    if (error instanceof multer.MulterError && error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected field name. Expected 'image' for single upload or 'images' for multiple uploads." });
    }
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

const uploadMultipleFiles = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imageUrls = req.files.map((file) =>
      cloudinary.url(file.filename, {
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      })
    );

    res.status(200).json({ imageUrls });
  } catch (error) {
    if (error instanceof multer.MulterError && error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Unexpected field name. Expected 'images' for multiple uploads." });
    }
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFile,
  uploadMultipleFiles,
};