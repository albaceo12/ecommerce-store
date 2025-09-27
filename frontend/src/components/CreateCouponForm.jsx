import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useAdminStore } from "../stores/useAdminStore";
import {
  Ticket,
  Percent,
  Calendar,
  User,
  AlertTriangle,
  Loader,
} from "lucide-react";

// 1. ✅ Define the Zod schema for form validation
const couponSchema = z.object({
  code: z
    .string()
    .min(3, { message: "Coupon code must be at least 3 characters." }),
  discountPercentage: z
    .number()
    .min(1, { message: "Discount must be at least 1%" })
    .max(100, { message: "Discount cannot be more than 100%" }),
  expirationDate: z
    .string()
    .optional()
    //  .refine() is a custom validation function provided by Zod, allowing you to add custom validation rules to your schema.
    .refine(
      (date) => !date || new Date(date) > new Date(),
      "Expiration date must be in the future."
    ),
  userId: z.string().optional(),
  usageLimit: z.number().optional(),
});

const CreateCouponForm = () => {
  const { createCoupon } = useAdminStore(); // ✅ Get the createCoupon function from the store

  // 2. ✅ Use react-hook-form for state and validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discountPercentage: 10,
      expirationDate: "",
      userId: "",
      usageLimit: 1,
    },
  });

  // 3. ✅ Handle form submission
  const onSubmit = async (data) => {
    const result = await createCoupon(data);
    if (result.success) {
      reset();
    } else {
      if (result.statusCode === 409) {
        // Use setError for specific, field-related errors
        setError("code", {
          type: "manual",
          message: result.message,
        });
      }
    }
  };

  // 4. ✅ Render the form and messages
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        className="bg-gray-800/60 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-emerald-400 mb-6 text-center">
          Create New Coupon
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div className="flex flex-col">
              <label htmlFor="code" className="text-gray-400 text-sm mb-2">
                Coupon Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  {...register("code")}
                  className="w-full bg-gray-700/50 rounded-lg p-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>
              {errors.code && (
                <span className="text-red-400 text-xs mt-1">
                  {errors.code.message}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="discountPercentage"
                className="text-gray-400 text-sm mb-2"
              >
                Discount Percentage (%)
              </label>
              <div className="relative">
                <input
                  id="discountPercentage"
                  type="number"
                  {...register("discountPercentage", { valueAsNumber: true })}
                  className="w-full bg-gray-700/50 rounded-lg p-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>
              {errors.discountPercentage && (
                <span className="text-red-400 text-xs mt-1">
                  {errors.discountPercentage.message}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="expirationDate"
                className="text-gray-400 text-sm mb-2"
              >
                Expiration Date (Optional)
              </label>
              <div className="relative">
                <input
                  id="expirationDate"
                  type="date"
                  {...register("expirationDate")}
                  className="w-full bg-gray-700/50 rounded-lg p-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>
              {errors.expirationDate && (
                <span className="text-red-400 text-xs mt-1">
                  {errors.expirationDate.message}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label htmlFor="userId" className="text-gray-400 text-sm mb-2">
                User ID (For Exclusive Coupon - Optional)
              </label>
              <div className="relative">
                <input
                  id="userId"
                  type="text"
                  {...register("userId")}
                  className="w-full bg-gray-700/50 rounded-lg p-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>
              {errors.userId && (
                <span className="text-red-400 text-xs mt-1">
                  {errors.userId.message}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="usageLimit"
                className="text-gray-400 text-sm mb-2"
              >
                Usage Limit (For Public Coupon - Optional)
              </label>
              <div className="relative">
                <input
                  id="usageLimit"
                  type="number"
                  {...register("usageLimit", { valueAsNumber: true })}
                  className="w-full bg-gray-700/50 rounded-lg p-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>
              {errors.usageLimit && (
                <span className="text-red-400 text-xs mt-1">
                  {errors.usageLimit.message}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              "Create Coupon"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateCouponForm;
