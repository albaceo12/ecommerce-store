import express from "express";
import {
  validateCoupon,
  getCoupon,
  createCoupon,
} from "../controllers/coupon.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/", protectRoute, getCoupon);
router.post("/", protectRoute, adminRoute, createCoupon);
router.post("/validate", protectRoute, validateCoupon);
export default router;

/**
 * When you use GET /, you are clearly and standardly telling the API: "Get all items (coupons) from this collection (coupons)."
 */

/**
 * When you use POST /, you are clearly and standardly telling the API: "Add a new item (coupon) to this collection (coupons)."
 */

/**
 * Using router.post("/create") is a bit redundant. The word "create" in the URL is a repetition of the meaning of the POST method. In modern API design, the URLs are designed to be as simple as possible, without any operation words, because the HTTP method itself specifies the operation.
 */
