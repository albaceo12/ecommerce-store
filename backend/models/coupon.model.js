import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: [true, "Code is required!"] },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, "discountPercantage is required!"],
    },
    // some coupons (like "first-purchase" coupons) are intended to be permanent and have no expiration date.
    // The validation logic for these coupons now checks for the existence of this field first.
    expirationDate: {
      type: Date,
      // required: [true, "expirationDate is required!"],
    },

    // This field is an administrative, manual flag. This field allows an admin to enable or disable the coupon at any time, regardless of the expiration date. - isActive is a powerful administrative tool
    isActive: { type: Boolean, default: true },

    // ✅ Number of times a public coupon has been used
    usageCount: {
      type: Number,
      default: 0,
    },
    // ✅ Maximum number of uses (for public coupons)
    usageLimit: {
      type: Number,
      required: false,
    },
    // ✅ This field tracks the usage status of exclusive coupons
    isUsed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: [true, "userId is required!"],
      // unique: true,  Each coupon is specific to one user, and each user can have several different coupons.
    },
    // ✅ New field to store coupon id in Stripe
    stripeCouponId: {
      type: String,
    },
  },
  { timestamps: true }
);
const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
