import express from "express";
import {
  createCheckoutSession,
  // checkoutSuccess,
  stripeWebhook,
  verifyCheckoutSession,
} from "../controllers/payment.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
// router.post("/checkout-success", protectRoute, checkoutSuccess);
router.post("/webhook", stripeWebhook); // ✅ New path for webhook
router.post("/checkout-verify", verifyCheckoutSession); // ✅ New path for webhook
export default router;
