import crypto from "crypto";
import Coupon from "../models/coupon.model.js";
import { stripe } from "../lib/stripe.js";
// ✅ Helper function: Create a new exclusive coupon in the database and in Stripe
// This function is used for high purchase rewards and creates a new coupon for each user.
async function createNewCoupon(userId, discountPercentage) {
  let uniqueCode;
  let couponExists;
  // ✅ Generate a unique and random code

  do {
    // ✅ Generate a unique and random code
    uniqueCode = crypto.randomBytes(6).toString("hex").toUpperCase();

    // ✅ Checking for the existence of code in the database
    couponExists = await Coupon.findOne({ code: uniqueCode }); //This query finds all coupons whose code is the same as the new code, whether active or inactive.
  } while (couponExists); // If the code exists, try again

  const stripeCoupon = await stripe.coupons.create({
    duration: "once",
    percent_off: discountPercentage,
  });

  const newCoupon = new Coupon({
    code: uniqueCode, // ✅ Use a unique code
    discountPercentage, // ✅ Using dynamic discount percentage
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    userId,
    stripeCouponId: stripeCoupon.id,
  });

  await newCoupon.save();
  return newCoupon;
}
export default createNewCoupon;
