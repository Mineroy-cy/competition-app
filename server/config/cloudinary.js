const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

let upload;

// Check if using dummy keys
if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key_here') {
  console.warn("Using dummy Cloudinary keys! Falling back to memory storage.");
  upload = multer({ storage: multer.memoryStorage() });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'competition_app', 
      allowedFormats: ['jpeg', 'png', 'jpg'],
    },
  });

  upload = multer({ storage: storage });
}

module.exports = { cloudinary, upload };
