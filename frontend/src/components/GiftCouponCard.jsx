import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import { XCircle } from "lucide-react";
const GiftCouponCard = () => {
  const [userInputCode, setUserInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { coupon, coupons, applyCoupon, getMyCoupons, removeCoupon } =
    useCartStore();

  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      try {
        await getMyCoupons();
      } catch (error) {
        console.log("error in fetching coupons");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, [getMyCoupons]);

  useEffect(() => {
    if (coupon) {
      setUserInputCode(coupon.code);
    } else {
      setUserInputCode("");
    }
  }, [coupon]);

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setUserInputCode("");
  };
  const hasCoupons = coupons && coupons.length > 0;
  const hasAppliedCoupon = !!coupon;
  const isInputDisabled = isLoading || hasAppliedCoupon;
  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="voucher"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Do you have a voucher or gift card?
          </label>
          <input
            type="text"
            id="voucher"
            className="block w-full rounded-lg border border-gray-600 bg-gray-700 
            p-2.5 text-sm text-white placeholder-gray-400 focus:border-emerald-500 
            focus:ring-emerald-500"
            placeholder={
              isLoading
                ? "Loading..."
                : hasCoupons
                ? "Enter code here"
                : "No coupons available to apply"
            }
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value)}
            required
            disabled={isInputDisabled}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="mt-4 text-center">
          <p className="text-gray-400">Loading coupons...</p>
        </div>
      ) : hasAppliedCoupon ? (
        <div className="mt-4 flex items-center justify-between rounded-md bg-emerald-600/20 p-2">
          {/* Show applied coupon */}
          <h3 className="text-lg font-medium text-emerald-400">
            Applied Coupon:
          </h3>
          <div className="flex items-center space-x-2">
            <p className="mt-2 text-sm text-emerald-400">
              {coupon.code} - {coupon.discountPercentage}% off
            </p>
            <motion.button
              type="button"
              className="rounded-full bg-red-600 p-1 text-white hover:bg-red-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoveCoupon}
            >
              <XCircle size={16} />
            </motion.button>
          </div>
        </div>
      ) : hasCoupons ? (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">
            Your Available Coupons:
          </h3>
          <ul className="mt-2 space-y-2">
            {coupons.map((couponItem) => (
              <li
                key={couponItem.code}
                className="flex items-center justify-between rounded-md bg-gray-700 p-2"
              >
                <p className="text-sm text-gray-400">
                  {couponItem.code} - {couponItem.discountPercentage}% off
                </p>
                <motion.button
                  type="button"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyCoupon(couponItem.code)}
                >
                  Apply
                </motion.button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-gray-400">
            You don't have any coupons available at the moment.
          </p>
        </div>
      )}
    </motion.div>
  );
};
export default GiftCouponCard;
