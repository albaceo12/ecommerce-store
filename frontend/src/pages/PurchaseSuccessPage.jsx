import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import Confetti from "react-confetti";
const extractDeliveryTime = (shippingName) => {
  const regex = /\((.*?)\)/;
  const match = shippingName.match(regex);
  return match ? match[1] : "Not specified";
};
const PurchaseSuccessPage = () => {
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [timer, setTimer] = useState(15); // ✅ A state for the timer
  const [isVerifying, setIsVerifying] = useState(true); // New state to show loading status
  const [orderNumber, setOrderNumber] = useState(null); // State for the order number
  const [shippingMethodName, setShippingMethodName] = useState("Loading...");
  //Handler function for clicking the button
  const handleReturnHome = () => {
    navigate("/");
  };
  useEffect(() => {
    // ✅ Check if the sessionId is present in the URL
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );

    if (sessionId) {
      // Send the session_id to the backend for verification
      (async () => {
        try {
          const res = await axios.post("/payments/checkout-verify", {
            sessionId,
          });
          setIsVerifying(false);
          clearCart();
          setOrderNumber(res.data.orderId);
          setShippingMethodName(res.data.shippingMethodName);
          // ✅ We set a 15 second timer for the redirect
          const timerInterval = setInterval(() => {
            setTimer((prevTimer) => {
              if (prevTimer <= 1) {
                clearInterval(timerInterval);
                navigate("/");
                return 0;
              }
              return prevTimer - 1;
            });
          }, 1000);

          // ✅ Clear interval when component is unmounted
          return () => clearInterval(timerInterval);
        } catch (error) {
          console.error("Verification failed:", error);
          // Check for a 409 Conflict error
          if (error.response && error.response.status === 409) {
            // A 409 means the order already exists.
            const existingOrderId = error.response.data.orderId;
            navigate(`/`, { replace: true });
          }
          // Check for a 402 Payment Required error
          else if (error.response && error.response.status === 402) {
            // A 402 means the payment was not successful.
            navigate("/purchase-cancel");
          }
          // Handle any other errors (e.g., 400, 500, network issues)
          else {
            navigate("/purchase-cancel");
          }
        }
      })();
    } else {
      // ✅ If the sessionId is not present in the URL, it means the user has manually refreshed the page
      // or has come directly to this page.
      // In this case, we redirect them to the home page.
      navigate("/");
    }
  }, [navigate, clearCart]);

  if (isVerifying) {
    return (
      <div className="h-screen flex items-center justify-center text-white text-2xl">
        Verifying your payment... 🧐
      </div>
    );
  }
  return (
    <div className="h-screen flex items-center justify-center px-4">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.1}
        style={{ zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />

      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center">
            <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2">
            Purchase Successful!
          </h1>

          <p className="text-gray-300 text-center mb-2">
            Thank you for your order. {"We're"} processing it now.
          </p>
          <p className="text-emerald-400 text-center text-sm mb-6">
            Check your email for order details.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Order number</span>
              <span className="text-sm font-semibold text-emerald-400">
                #{orderNumber || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Estimated delivery</span>
              <span className="text-sm font-semibold text-emerald-400">
                {extractDeliveryTime(shippingMethodName)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* ✅ This button is now your main action button */}
            <button
              onClick={handleReturnHome}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4
                                rounded-lg transition duration-300 flex items-center justify-center"
            >
              <HandHeart className="mr-2" size={18} />
              {/* ✅ The text is now dynamic based on the timer */}
              {timer > 0 ? `Return Home in ${timer}s` : "Returning Home..."}
            </button>
            <Link
              to={"/"}
              className="w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 
            rounded-lg transition duration-300 flex items-center justify-center"
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PurchaseSuccessPage;
