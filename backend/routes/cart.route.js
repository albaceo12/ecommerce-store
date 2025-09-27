import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCart);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeFromCart);
router.put("/:id", protectRoute, updateQuantity);
export default router;
