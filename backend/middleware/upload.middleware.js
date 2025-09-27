import multer from "multer";
import { uploadToCloudinary } from "../lib/cloudinary.js";
// Configure storage
// ✅ 1. Storage: Memory Storage : Because we upload directly to Cloudinary
const storage = multer.memoryStorage(); // or use diskStorage if you want to save to disk

// ✅ 2. File filter: Image file only (jpg, png, jpeg, webp)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ 3. Size limit: 5MB
const limits = { fileSize: 5 * 1024 * 1024 }; // 2MB

const upload = multer({
  storage,
  fileFilter,
  limits,
});
// ✅ 2. Middleware for direct upload to Cloudinary
export const cloudinaryUploader = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(422).json({ message: "Sending an image is required" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    // Store the address and public_id in req so the controller can access it
    req.cloudinaryImage = {
      url: result.secure_url,
      public_id: result.public_id,
    };

    next();
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    return res.status(500).json({
      message: "Error uploading image to Cloudinary",
      error: error.message,
    });
  }
};

export default upload;
