import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import { stripe } from "../lib/stripe.js";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import createNewCoupon from "../utils/createNewCoupon.js";
import { sendOrderConfirmationEmail } from "../utils/emailFunc.js";
// ✅ Import the crypto module for generating unique IDs

export const createCheckoutSession = async (req, res) => {
  try {
    const { couponCode, shippingMethod, confirmed } = req.body;
    const { user } = req; // ✅ Use the user object from the request

    // ✅ Use user.cartItems directly
    // This is secure because the cart is fetched from the database, not from the frontend.
    const populatedUser = await user.populate("cartItems.product");
    const productsInCart = populatedUser.cartItems;
    if (productsInCart.length === 0) {
      return res.status(422).json({ message: "Cart is empty" });
    }
    /*
  CRITICAL PRE-PAYMENT VALIDATION
  This loop is a crucial final security and integrity check.
  We must NOT trust the state of the cart as it was when the user
  last interacted with the page. A small but critical race condition
  can occur where a product is deleted or its stock is sold out by
  another user between the time the cart was viewed and payment
  was initiated.

  This check guarantees that the user is paying for:
  1. Products that still exist.
  2. Products with sufficient stock to fulfill the order.

  Failing to do this could lead to:
  - Server errors during checkout.
  - Failed transactions and payment disputes.
  - Inability to fulfill an order (selling an item that is out of stock).
*/
    if (!confirmed) {
      // ✅ New and improved logic for cart validation and user confirmation
      const validItems = [];
      const removedItems = [];
      for (const item of productsInCart) {
        const productDetails = item.product;
        if (!productDetails) {
          removedItems.push({
            name: "Unknown Product",
            id: productDetails._id,
            reason: "no longer exists",
          });
        } else if (productDetails.stock < item.quantity) {
          removedItems.push({
            name: productDetails.name,
            id: productDetails._id,
            reason: "is out of stock at the moment",
          });
        } else if (productDetails.price !== item.price) {
          removedItems.push({
            name: productDetails.name,
            id: productDetails._id,
            reason: `price has changed from $${item.price} to $${productDetails.price}`,
          });
        } else {
          validItems.push(item);
        }
      }
      // ✅ If any items were removed, stop the process and inform the user
      if (removedItems.length > 0) {
        // We return a 422 status code because the request entity (the cart) is unprocessable
        return res.status(422).json({
          message: "Some items in your cart are no longer available.",
          removedItems,
        });
      }
    }
    // ✅ After the check (or if confirmed), use the up-to-date cart from the user object
    const finalProductsInCart = user.cartItems;
    if (finalProductsInCart.length === 0) {
      return res.status(422).json({
        message: "Your cart is now empty as all items were unavailable.",
      });
    }
    // ✅ Build lineItems using secure prices from the database
    const lineItems = finalProductsInCart.map((item) => {
      const productDetails = item.product;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: productDetails.name,
            images: [productDetails.image],
          },
          unit_amount: productDetails.price * 100, // ✅ Secure price from the populated product
        },
        quantity: item.quantity,
      };
    });
    // ✅ Calculate the total amount before any discounts
    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    );
    let stripeCouponId = null;

    if (couponCode) {
      // ✅ Find the valid coupon that has already been validated by the frontend with validate api
      const coupon = await Coupon.findOne({ code: couponCode });

      if (coupon) {
        stripeCouponId = coupon.stripeCouponId;
      }
    }
    // ✅ Calculate shipping cost based on the method from req.body
    let shippingCost = 0;
    let shippingMethodName = "";

    if (shippingMethod === "standard") {
      shippingCost = 3000; // 30 USD
      shippingMethodName = "Standard Shipping (5-7 business days)";
    } else if (shippingMethod === "express") {
      shippingCost = 7000; // 70 USD
      shippingMethodName = "Express Shipping (1-2 business days)";
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      // When we use shipping_options in the backend when creating a session for Stripe, we tell Stripe to take responsibility for collecting shipping information.
      // we are essentially telling Stripe that this is a physical product and that it should receive shipping information from the customer.
      // We don't need to do anything in the frontend to collect shipping information.
      // no longer need to create a separate addressing form on your frontend.
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCost,
              currency: "usd",
            },
            display_name: shippingMethodName,
          },
        },
      ],
      mode: "payment",
      // it automatically replaces {CHECKOUT_SESSION_ID} with the unique session ID it just created for that transaction.
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      // Storing information in metadata in Stripe, stringifying (toString) is a must and not a choice.
      // Stripe is similar to Redis in the way it stores data in metadata. In Redis, data is stored as "key-value" pairs, and both keys and values are usually of type string.
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",

        // ✅ Save both amounts in metadata
        totalAmountBeforeDiscount: totalAmount.toString(),
      },
    });

    res.json({ sessionId: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.log("error in create checkout session controller");
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};

// ✅ New controller to handle webhook requests
// The stripeWebhook function is called by Stripe, not by your application.
// It acts as an endpoint in your backend.
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Here we validate the event using Stripe signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Webhook validation error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // ✅ Handling the event based on its type
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      // ✅ We get essential information from metadata
      const { couponCode, userId, totalAmountBeforeDiscount } =
        session.metadata;
      const shippingDetails = session.shipping_details;

      // ✅ We get the shipping details
      const shippingMethodName =
        session.shipping_options[0].shipping_rate.display_name;
      const shippingCost =
        session.shipping_options[0].shipping_rate.fixed_amount.amount / 100;
      // ✅ Deactivate used coupon
      if (couponCode) {
        // ✅ First we find the coupon
        const coupon = await Coupon.findOne({ code: couponCode });

        if (coupon) {
          // ✅ If the coupon was exclusive, we mark it as used
          if (coupon.userId) {
            await Coupon.updateOne({ _id: coupon._id }, { isUsed: true });
          }
          // ✅ If the coupon was public, we would increase the number of uses
          else {
            await Coupon.updateOne(
              { _id: coupon._id },
              { $inc: { usageCount: 1 } }
            );

            // ✅ We disable it if the usage limit is reached
            if (
              coupon.usageLimit &&
              coupon.usageCount + 1 >= coupon.usageLimit
            ) {
              await Coupon.updateOne({ _id: coupon._id }, { isActive: false });
            }
          }
        }
      }
      // ✅ Find the user and their cart information from the database
      const user = await User.findById(userId).populate("cartItems.product");
      if (!user) {
        console.error(`User with ID ${userId} not found!`);
        return res.status(404).send(`User not found`);
      }

      // ✅ Get the products from the user's cart
      const productsInCart = user.cartItems;

      // ✅ Deduct the stock after successful payment
      for (const item of productsInCart) {
        const product = item.product;
        const quantityToDeduct = item.quantity; // Use findOneAndUpdate with $inc to atomically decrease stock // The use of $inc here is crucial to prevent race conditions

        await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: quantityToDeduct } },
          { $inc: { stock: -quantityToDeduct } }
        );
      }

      const orderProducts = productsInCart.map((item) => {
        const productDetails = item.product;
        return {
          product: productDetails._id,
          quantity: item.quantity,
          price: productDetails.price, // ✅ Secure price from the populated product
        };
      });

      // ✅ Create a new order
      const newOrder = new Order({
        user: userId,
        products: orderProducts,
        // amount_total: This field is calculated by Stripe and shows the total final payment amount. This amount includes the product price, taxes, and shipping costs, and is calculated after any discounts (coupons) are applied.

        // This is the amount that Stripe returns to us after final processing of the payment. We use this amount to finally record the order in our database.
        totalAmount: session.amount_total / 100,
        stripeSessionId: session.id,
        shippingCost,
        shippingMethodName,
        shippingAddress: {
          address: shippingDetails.address,
          name: shippingDetails.name,
        },
      });

      await newOrder.save();
      // ✅ the user's shopping cart is emptied right after the order is successfully registered in the database.
      user.cartItems = [];
      user.totalOrders += 1; // ✅ Increment the user's total number of orders by one

      // ✅  Award a reward coupon for every 3 successful orders
      if (user.totalOrders > 0 && user.totalOrders % 3 === 0) {
        await createNewCoupon(user._id, 20);
        console.log(
          `✅ A new reward coupon was awarded to user ${user._id} on their ${user.totalOrders}th successful order.`
        );
      }
      await user.save(); // ✅ Here all user changes are saved in one place

      // ✅ Awarding reward coupons based on a tiered system
      const totalAmount = parseInt(totalAmountBeforeDiscount);
      let rewardPercentage = 0;
      let rewardCoupon = null;

      if (totalAmount > 100000) {
        rewardPercentage = 40; // 40% discount for purchases over 1000 USD (100000 cents)
      } else if (totalAmount > 50000) {
        rewardPercentage = 25; // 25% discount for purchases over 500 USD (50000 cents)
      } else if (totalAmount > 20000) {
        rewardPercentage = 10; // 10% discount for purchases over 200 USD (20000 cents)
      }

      // ✅ If a reward tier is reached
      if (rewardPercentage > 0) {
        // ✅ Check if the user already has an unused coupon of the same or higher value
        // This prevents accumulation of multiple coupons and encourages using the existing one.
        const existingRewardCoupon = await Coupon.findOne({
          userId,
          discountPercentage: { $gte: rewardPercentage }, // Check for a coupon of the same or higher value
          isUsed: false,
          isActive: true,
        });

        if (!existingRewardCoupon) {
          // If no existing reward coupon is found, create a new one
          rewardCoupon = await createNewCoupon(userId, rewardPercentage);
          console.log(
            `✅ A new ${rewardPercentage}% reward coupon was created for user ${userId}.`
          );
        } else {
          console.log(
            `❌ User ${userId} already has an active reward coupon (${existingRewardCoupon.discountPercentage}%). A new one was not created.`
          );
        }
      }
      // ✅ Add the email sending function here
      await sendOrderConfirmationEmail(user, newOrder);
      console.log("✅ Successful payment and order placed:", newOrder._id);
      break;

    default:
      console.log(`Unknown event: ${event.type}`);
  }

  // ✅ Successful response to Stripe
  console.log("✅ Success:", event.id);
  res.json({ received: true });
};
// The stripeWebhook function and the redirect to success_url happen at the same time.
// These two processes work independently of each other.
// Therefore, it is entirely possible that the user is redirected to the success page while the stripeWebhook function is still performing heavy lifting such as depleting inventory, placing orders in the database, and emptying the shopping cart.
// If the user clicks the "Cancel" button on the Stripe payment page, the stripeWebhook function will not be executed at all.
export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(422).json({ message: "Session ID is required" });
    }
    // ✅ First, check if an order with this sessionId already exists in our database.
    const existingOrder = await Order.findOne({ stripeSessionId: sessionId });

    if (existingOrder) {
      // ✅ If the order exists, it means the session has been verified before.
      return res.status(409).json({
        message: "Payment already verified. Redirecting to order.",
        orderId: existingOrder._id,
        shippingMethodName: existingOrder.shippingMethodName,
      });
    }
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the payment was successful
    if (session.payment_status === "paid") {
      // Find the corresponding order you created in the webhook
      const order = await Order.findOne({ stripeSessionId: sessionId });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found for this session ID" });
      }

      // Return a success message and the real order ID
      return res.status(200).json({
        message: "Payment successful and verified",
        orderId: order._id,
        shippingMethodName: order.shippingMethodName,
      });
    } else {
      // ✅ Use 402 Payment Required for an unsuccessful payment.
      return res.status(402).json({ message: "Payment was not successful" });
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// export const checkoutSuccess = async (req, res) => {
//   try {
//     const { sessionId } = req.body;
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status === "paid") {
//       // ✅ غیرفعال کردن کوپن استفاده شده
//       if (session.metadata.couponCode) {
//         // از findOneAndUpdate استفاده می‌کنیم تا کوپن را پیدا و غیرفعال کند
//         await Coupon.findOneAndUpdate(
//           {
//             code: session.metadata.couponCode,
//             $or: [
//               { userId: { $exists: false } },
//               { userId: session.metadata.userId },
//             ],
//           },
//           { isUsed: true }, // ✅ تنها در این صورت، کوپن به عنوان استفاده‌شده علامت‌گذاری می‌شود
//           { new: true } // این آپشن مهم است تا سند به‌روزرسانی‌شده را برگرداند
//         );
//       }

//       // ✅ ایجاد سفارش جدید
//       const products = JSON.parse(session.metadata.products);
//       const newOrder = new Order({
//         user: session.metadata.userId,
//         products: products.map((product) => ({
//           product: product.id,
//           quantity: product.quantity,
//           price: product.price,
//         })),
//         totalAmount: session.amount_total / 100,
//         stripeSessionId: sessionId,
//       });

//       await newOrder.save();

//       // ✅ منطق پاداش: ایجاد کوپن جدید فقط پس از پرداخت موفق
//       if (parseInt(session.metadata.totalAmountBeforeDiscount) > 20000) {
//         await createNewCoupon(session.metadata.userId, 10);
//       }

//       res.json({
//         success: true,
//         message:
//           "Payment successful, order created, and coupon deactivated if used",
//         orderId: newOrder._id,
//       });
//     } else {
//       res
//         .status(400)
//         .json({ success: false, message: "Payment was not successful." });
//     }
//   } catch (error) {
//     console.log("error in checkout success controller", error);
//     res
//       .status(500)
//       .json({ message: "internal server error", error: error.message });
//   }
// };
