import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
// A hypothetical rate limiting middleware for Node.js
import rateLimit from "express-rate-limit";
export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies["access-token"];
    if (!accessToken)
      return res
        .status(401)
        .json({ message: "unauthorized - No token provided" });
    // because if we get error in decoded and not handled throws and error and shutting down thats why using trycatch block
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET_KEY_ACCESS
      );
      const user = await User.findById(decoded.userId).select("-password");
      if (!user)
        return res
          .status(401)
          .json({ message: "unauthorized - invalid access token" });

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized access: Your session has expired." });
      }
      // Any other error during verification will throw the token out
      throw error;
    }
  } catch (error) {
    console.log("error in protect route middleware", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const adminRoute = async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({
        message:
          "Forbidden - Access Denied: You do not have permission to access this resource.",
      });
    next();
  } catch (error) {
    console.log("error in admin route middleware");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes per IP
  message:
    "Too many attempts have been made from this IP, please try again in 15 minutes.",
  headers: true, // Adds Rate-Limit headers to the response
});
