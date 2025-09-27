import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
const ShippingMethodSelector = () => {
  const { shippingMethod, setShippingMethod } = useCartStore();

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <h2 className="text-xl font-semibold text-white">Shipping Method</h2>
      <div className="space-y-4">
        <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
          <input
            type="radio"
            name="shipping"
            value="standard"
            checked={shippingMethod === "standard"}
            onChange={() => setShippingMethod("standard")}
            className="form-radio h-4 w-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500"
          />
          <div className="flex flex-col">
            <span className="text-base font-medium">Standard Shipping</span>
            <span className="text-sm font-normal text-gray-500">
              (5-7 business days)
            </span>
          </div>
          <span className="ml-auto text-gray-400">$30.00</span>
        </label>
        <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
          <input
            type="radio"
            name="shipping"
            value="express"
            checked={shippingMethod === "express"}
            onChange={() => setShippingMethod("express")}
            className="form-radio h-4 w-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-500"
          />
          <div className="flex flex-col">
            <span className="text-base font-medium">Express Shipping</span>
            <span className="text-sm font-normal text-gray-500">
              (1-2 business days)
            </span>
          </div>
          <span className="ml-auto text-gray-400">$70.00</span>
        </label>
      </div>
    </motion.div>
  );
};
export default ShippingMethodSelector;
