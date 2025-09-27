// adminStore.js (A new file for admin-related tasks)

import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-toastify";
export const useAdminStore = create((set) => ({
  createCoupon: async (couponData) => {
    try {
      await axios.post("/coupons", couponData);
      toast.success("Coupon created successfully");
      return { success: true }; // Return success status
    } catch (error) {
      console.error("Error in creating coupon. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        if (400 <= statusCode && statusCode < 500) {
          if (statusCode === 409) {
            return {
              statusCode,
              success: false,
              message: "A coupon with this code already exists.",
            };
          } else {
            errorMessage = error.response.data.message;
          }
        }
        // For other server errors (like 500), we display a more generic message.
        else {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
      return { success: false }; // Return success status
    }
  },
}));
