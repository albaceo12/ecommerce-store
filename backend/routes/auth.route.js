import express from "express";
import {
  login,
  logout,
  signup,
  refreshToken,
  getProfile,
} from "../controllers/auth.controller.js";
import { protectRoute, loginLimiter } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", loginLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
export default router;
