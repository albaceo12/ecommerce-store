import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductByCategory,
  toggledFeaturedProduct,
} from "../controllers/product.controller.js";
import upload, { cloudinaryUploader } from "../middleware/upload.middleware.js";
const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductByCategory);
router.get("/recommendations", getRecommendedProducts);
router.post(
  "/",
  protectRoute,
  adminRoute,
  upload.single("image"), // Step 1: Get file from user
  cloudinaryUploader, // Step 2: Upload directly to Cloudinary
  createProduct
);
router.patch("/:id", protectRoute, adminRoute, toggledFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);
export default router;
