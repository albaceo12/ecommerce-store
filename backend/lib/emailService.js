import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create a transporter using your email service's SMTP details
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services or direct SMTP
  auth: {
    user: process.env.EMAIL_USER, // Your email address from .env
    pass: process.env.EMAIL_PASS, // Your email password or app password from .env
  },
});

export default transporter;
