import { useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";
import axios from "../lib/axios";

// ✅ Simulated data for error 422
const mockRemovedItemsError = {
  response: {
    status: 422,
    data: {
      message: "Some items in your cart are no longer available.",
      removedItems: [
        {
          name: "Organic Honeycomb",
          reason: "Out of stock",
        },
        {
          name: "Artisanal Cheese Set",
          reason: "Price has changed",
        },
      ],
    },
  },
};
const isMock = false; // Use this to toggle between mock and real API
/*
 * Stripe.js is loaded in the frontend using the publishable key.
 * This ensures a direct and secure connection between the user's browser and Stripe's servers.
 * The main purpose is to securely collect the user's payment information (like credit card details)
 * without that sensitive data ever touching your server.
 * This approach significantly reduces your security liability as Stripe handles the PCI compliance.
 * In contrast, the backend uses the secret key to perform server-side operations such as creating the payment session.
 */
// ✅ Getting the key from the environment variable provided by Vite
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const OrderSummary = () => {
  const {
    total,
    subtotal,
    coupon,
    isCouponApplied,
    cart,
    savings,
    shippingMethod,
    clearCart,
  } = useCartStore();
  // ✅ Define the shipping costs here too for display purposes
  const shippingCosts = {
    standard: 30,
    express: 70,
  };
  const [isProcessing, setIsProcessing] = useState(false);
  // ✅ New state for the modal
  const [showModal, setShowModal] = useState(false);
  const [removedItemsList, setRemovedItemsList] = useState([]);

  const formattedSubtotal = subtotal.toFixed(2);
  const formattedTotal = total.toFixed(2);
  const formattedSavings = savings?.toFixed(2);
  const formattedShipping = shippingCosts[shippingMethod]?.toFixed(2) || "0.00";
  // It takes an optional 'confirmed' flag to signal the server
  const handlePayment = async (isConfirmed = false) => {
    setIsProcessing(true);
    if (isMock) {
      try {
        throw mockRemovedItemsError;
      } catch (error) {
        setIsProcessing(false);
        console.log("Error in handlePayment:", error);

        // ✅ If we're in mock testing mode, use our mock data

        if (
          mockRemovedItemsError.response?.status === 422 &&
          mockRemovedItemsError.response.data?.removedItems
        ) {
          setRemovedItemsList(mockRemovedItemsError.response.data.removedItems);
          setShowModal(true);
          return;
        }
      }
    } else {
      try {
        sessionStorage.setItem("is-first-visit", "true");
        const stripe = await stripePromise;
        // ✅ We pass the confirmed flag to the backend
        const res = await axios.post("/payments/create-checkout-session", {
          couponCode: coupon ? coupon.code : null,
          shippingMethod: shippingMethod,
          confirmed: isConfirmed, // ✅ Pass the confirmation flag
        });
        const { sessionId } = res.data;
        await stripe.redirectToCheckout({
          sessionId,
        });
      } catch (error) {
        setIsProcessing(false);
        console.log("Error in handlePayment:", error);

        // We define a variable to store the error message.
        let errorMessage = "An unknown error occurred.";

        // Check if a response has been received from the server.
        if (error.response) {
          const statusCode = error.response.status;

          // Check for specific error status codes
          if (400 <= statusCode && statusCode < 500) {
            if (statusCode === 422 && error.response.data?.removedItems) {
              setRemovedItemsList(error.response.data.removedItems);
              setShowModal(true); // ✅ Show the modal instead of a toast
              return;
            }
            errorMessage = error.response.data.message;
          } else if (statusCode >= 500) {
            // Handle a general server error (e.g., database connection issues).
            errorMessage =
              "An internal server error occurred. Please try again later.";
          }
        } else {
          // If no response was received from the server (network error)
          errorMessage =
            "Network error. Please check your internet connection.";
        }

        toast.error(errorMessage, {
          //The toastId can be any unique string.
          toastId: "toastId",
        });
      }
    }
  };
  const handleProceed = () => {
    setShowModal(false);
    // ✅ Call handlePayment again with the confirmation flag
    handlePayment(true);
  };

  const handleCancel = () => {
    setShowModal(false);
    clearCart(); // ✅ Clear the cart if the user cancels
    toast.info("Your cart has been cleared.");
  };
  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-emerald-400">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">
              Original price
            </dt>
            <dd className="text-base font-medium text-white">
              ${formattedSubtotal}
            </dd>
          </dl>
          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">Savings</dt>
              <dd className="text-base font-medium text-emerald-400">
                -${formattedSavings}
              </dd>
            </dl>
          )}
          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">
                Coupon ({coupon.code})
              </dt>
              <dd className="text-base font-medium text-emerald-400">
                -{coupon.discountPercentage}%
              </dd>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">Shipping</dt>
            <dd className="text-base font-medium text-white">
              ${formattedShipping}
            </dd>
          </dl>
          <dl className="flex items-center justify-between gap-4 border-t border-gray-600 pt-2">
            <dt className="text-base font-bold text-white">Total</dt>
            <dd className="text-base font-bold text-emerald-400">
              ${formattedTotal}
            </dd>
          </dl>
        </div>

        <motion.button
          className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Proceed to Checkout"}
        </motion.button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline"
          >
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
      {/* ✅ The Modal Component */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            className="bg-gray-800 rounded-lg p-6 shadow-xl text-white max-w-sm w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4 text-red-500">
              Unavailable Items Found
            </h2>
            <p className="mb-4">
              Some items in your cart are no longer available and will be
              removed. Do you want to proceed with the remaining items?
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-300">
              {removedItemsList.map((item, index) => (
                <li key={index}>
                  {item.name} ({item.reason})
                </li>
              ))}
            </ul>
            <div className="flex justify-between gap-4">
              <button
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleCancel}
              >
                Cancel & Clear Cart
              </button>
              <button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleProceed}
              >
                Proceed
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default OrderSummary;
