process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("uncaugh exception occured! shutting down");
  process.exit(1);
});

import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import multer from "multer";
import connectDB from "./lib/db.js";
import cors from "cors";

// import cors from "cors";
dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(
  cors({
    origin: "https://ecommerce-store-jnz5.onrender.com",
    credentials: true,
  })
); // the cors middleware
// ✅ We only use express.raw for the webhook route
app.use("/api/payments/webhook", bodyParser.raw({ type: "application/json" }));

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// 🛑 Catch-all route for undefined paths (404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "route not found !!!" });
});

// 🌟 Handler for Multer and image validation errors
app.use((err, req, res, next) => {
  // multer errors (e.g. large volume)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(422)
        .json({ message: "File size must be less than 2 MB" });
    }
    return res.status(422).json({ message: err.message });
  }
  const KNOWN_FILE_ERRORS = [
    "Only image files are allowed!",
    "File type not supported",
  ];

  // Errors we threw in fileFilter (e.g. non-image file)
  if (err && KNOWN_FILE_ERRORS.includes(err.message)) {
    return res.status(422).json({ message: err.message });
  }

  // ❗ Any error that is not here, we send to the next layer (main errorHandler)
  next(err); // Give it to the main handler
});

// 🌟 Main handler (all errors)
app.use((error, req, res, next) => {
  console.error("🔥 Server Error:", error);
  res.status(error.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "There's a problem!"
        : error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("unhandled rejection occured!! shutting down");
  //  process.exit(1)
  server.close(() => {
    process.exit(1);
  });
});
