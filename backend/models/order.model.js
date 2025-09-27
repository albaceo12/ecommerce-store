import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    stripeSessionId: { type: String, unique: true },
    shippingMethodName: {
      type: String,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      address: {
        city: String,
        country: String,
        line1: String,
        line2: String,
        postal_code: String,
        state: String,
      },
      name: String,
    },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);
export default Order;
