import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import dotenv from "dotenv";
dotenv.config();
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET_KEY_ACCESS, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET_KEY_REFRESH,
    {
      expiresIn: "7d",
    }
  );
  return { accessToken, refreshToken };
};
// Helper function to store Refresh Token in Redis
const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60
    );
  } catch (error) {
    console.error("Redis Error:", error); // Logs Redis errors to the console (developer only)
  }
};
// Helper function for setting cookies
const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
    sameSite: "strict", // Protect against CSRF attacks
  });
  res.cookie("refresh-token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
  });
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id);
    storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User created successfully!",
    });
  } catch (error) {
    console.log(error);
    // 👇 Duplicate key error handling
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    // 👇 Mongoose validation error handling
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(422).json({
        message: "Validation failed!",
        errors: errorMessages, // Send an array of exact messages
      });
    }
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("error in login controller", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh-token"];
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET_KEY_REFRESH
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie("refresh-token");
    res.clearCookie("access-token");
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.log("error in logout controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies["refresh-token"];

    if (!refreshToken)
      return res.status(401).json({
        message: "Unauthorized - Authentication failed: Token not found.",
      });

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_KEY_REFRESH
    );
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    // If the token stored in Redis is not the same as the token sent (may indicate the token is expired or tampered with)
    if (storedToken !== refreshToken)
      return res.status(401).json({
        message: "Unauthorized - Authentication failed: Invalid refresh token",
      });

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET_KEY_ACCESS,
      {
        expiresIn: "15m",
      }
    );
    res.cookie("access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
      sameSite: "strict",
    });
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("error in refresh token controller", error);
    // If the refresh token has expired
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Your session has expired. Please log in again." });
    }
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.log("error in get profile controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
