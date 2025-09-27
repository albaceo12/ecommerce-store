import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
export const createCoupon = async (req, res) => {
  const { code, discountPercentage, expirationDate, userId, usageLimit } =
    req.body;

  try {
    // ✅ Step 1: Create a coupon in Stripe
    const stripeCoupon = await stripe.coupons.create({
      duration: "once",
      percent_off: discountPercentage,
    });

    // ✅ Step 2: Save the coupon in our database with the Stripe ID
    const newCoupon = new Coupon({
      code,
      discountPercentage,
      ...(expirationDate && { expirationDate }), // ✅ Only adds the field if it exists
      stripeCouponId: stripeCoupon.id, // Save Stripe ID
      // ✅ Based on the existence of the userId, a exclusive or public coupon is created
      ...(userId && { userId }), // If userId does not exist spread synt doesnt cause any issue
      ...(usageLimit && { usageLimit }), // If usageLimit does not exist spread synt doesnt cause any issue
    });

    await newCoupon.save();
    res
      .status(201)
      .json({ coupon: newCoupon, message: "Coupon created successfully" });
  } catch (error) {
    console.log("error in create coupon controller", error);
    // validation for the errors: code, discountPercentage, expirationDate
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return res
        .status(422)
        .json({ message: "Validation failed!", errors: errorMessages });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Coupon code already exists" });
    }
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const getCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      // ✅ Find public or exclusive coupons
      // Using two separate $ors doesn't work properly. We need to combine them logically in one query.
      // In a JSON object, you cannot have two keys with the same name. The last key defined will overwrite the previous key.
      // even In an Object js, the last key overwrites previous keys with the same name.
      $and: [
        { $or: [{ userId: { $exists: false } }, { userId: req.user._id }] }, // Public or Current user exclusive coupons
        {
          $or: [
            { expirationDate: { $exists: false } },
            { expirationDate: { $gt: new Date() } },
          ],
        }, // having no expiration date or not expired
      ],
    });
    res.json(coupons);
  } catch (error) {
    console.log("error in get coupon controller", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    // ✅ First we find the coupon based on the code only
    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon is invalid." });
    }

    // ✅ Check for expiration date (handles both permanent and temporary coupons)
    if (coupon.expirationDate && coupon.expirationDate < new Date()) {
      return res.status(410).json({ message: "Coupon expired" });
    }

    // ✅ Check for first-purchase coupon
    if (coupon.code === "FIRST_PURCHASE") {
      const hasOrders = await Order.exists({ user: req.user._id });
      if (hasOrders) {
        return res.status(403).json({
          message: "This coupon is only for first-time purchases.",
        });
      }
    }
    // ✅ Validation logic based on coupon type
    if (coupon.userId) {
      // ✅ Exclusive coupon
      if (coupon.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "This coupon is not for you." });
      }
      if (coupon.isUsed) {
        return res
          .status(404)
          .json({ message: "Coupon has already been used." });
      }
    } else {
      // ✅ public coupon
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return res
          .status(404)
          .json({ message: "Coupon has reached its usage limit." });
      }
    }
    res.json({
      message: "coupon is valid",
      discountPercentage: coupon.discountPercentage,
      code: coupon.code,
    });
  } catch (error) {
    console.log("error in validate coupon controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

/*
updateOne: 

In the output, it returns an object containing information such as acknowledged: true and modifiedCount: 1, indicating that a document has been successfully modified.

It does not return the updated document itself.

For this reason, we use updateOne when we only want to modify a single document and do not need to use the information from that document in the rest of the code.

*/
/*
findOneAndUpdate: 

This method not only updates the database, but also returns the changed document.

By default, it returns the old version of the document. To get the new version, you need to use the { new: true } option.

We use this method when we need to access the new information of the document after an update.
*/
