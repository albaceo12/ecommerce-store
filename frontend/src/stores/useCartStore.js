import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-toastify";
import { debounce } from "../../utils/debounce.";
import cartMockData from "../../utils/cartMockData";
// Conditionally import the mock version of axios based on the 'isMock' flag.
const isMock = true; // Use this to toggle between mock and real API
const api = isMock ? cartMockData : axios;
// ✅ Define a constant for shipping costs
const SHIPPING_COSTS = {
  standard: 30,
  express: 70,
};
export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  coupons: [],
  total: 0,
  subtotal: 0,
  savings: 0,
  isCouponApplied: false,
  shippingMethod: "standard",
  setShippingMethod: (method) => {
    set({ shippingMethod: method });
    get().calculateTotals(); // ✅ Recalculate totals whenever the shipping method changes
  },
  getMyCoupons: async () => {
    try {
      const response = await api.get("/coupons");
      set({ coupons: response.data });
    } catch (error) {
      console.error("Error in fetching coupons. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        // The backend only returns 500 in this controller
        if (statusCode >= 500) {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    }
  },
  applyCoupon: async (code) => {
    try {
      const response = await api.post("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      console.error("Error in applying coupon. Please try again.");
      // A variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        // Check for specific error status codes
        if (400 <= statusCode && statusCode < 500) {
          errorMessage = error.response.data.message;
        } else if (statusCode >= 500) {
          // Handle a general server error (e.g., database connection issues).
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received (network error or CORS issue).
        errorMessage = "Network error. Please check your internet connection.";
      }
      toast.error(errorMessage);
    }
  },
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  getCartItems: async () => {
    try {
      const res = await api.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      console.error("Error in getting cart items. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        // The backend only returns 500 in this controller
        if (statusCode >= 500) {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    }
  },
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
    toast.success("Your shopping cart is empty.");
  },
  addToCart: async (product) => {
    try {
      const res = await api.post("/cart", { productId: product._id });
      toast.success("Product added to cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      console.error("Error in adding item. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;
        if (400 <= statusCode && statusCode < 500) {
          errorMessage = error.response.data.message;
        }
        // The backend only returns 500 in this controller
        else if (statusCode >= 500) {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    }
  },
  removeFromCart: async (productId) => {
    try {
      const res = await api.delete(`/cart`, { data: { productId } });
      set({ cart: res.data });
      toast.success("Product removed from cart.");
      get().calculateTotals();
    } catch (error) {
      console.error("Error in removing item. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;
        if (400 <= statusCode && statusCode < 500) {
          errorMessage = "the item is already gone.";
        }
        // The backend only returns 500 in this controller
        else if (statusCode >= 500) {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    }
  },
  updateQuantity: debounce(async (productId, quantity) => {
    // if (quantity === 0) {
    //   get().removeFromCart(productId);
    //   return;
    // }

    try {
      const res = await api.put(`/cart/${productId}`, { quantity });
      set({ cart: res.data });
      // set((prevState) => ({
      //   cart: prevState.cart.map((item) =>
      //     item._id === productId ? { ...item, quantity } : item
      //   ),
      // }));
      get().calculateTotals();
    } catch (error) {
      console.error("Error in updating cart. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;
        if (400 <= statusCode && statusCode < 500) {
          errorMessage = "the item is already gone.";
        }
        // The backend only returns 500 in this controller
        else if (statusCode >= 500) {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }
      toast.error(errorMessage);
    }
  }, 500),
  calculateTotals: () => {
    const { cart, coupon, shippingMethod } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let total = subtotal;
    let savings = 0; // ✅ Initialized savings to 0
    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
      savings = subtotal - total;
    }
    // ✅ Add the shipping cost to the total
    const shippingCost = SHIPPING_COSTS[shippingMethod] || 0;
    total += shippingCost;
    set({ subtotal, total, savings });
  },
}));
