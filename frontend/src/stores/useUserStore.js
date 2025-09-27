import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-toastify";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true, // A boolean that indicates if the user's authentication status is currently being checked.
  // It's set to true by default to prevent a "flash of unauthenticated content" on initial load,
  // ensuring a smooth user experience by showing a loading state until the real status is confirmed.

  /**
   * Handles user signup.
   * Compares passwords, sends data to backend, and handles various error scenarios.
   */
  signup: async ({ name, email, password, confirmPassword }) => {
    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      set({ user: res.data, loading: false });
      toast.success("Registration successful!");
      return { success: true }; // Return success status
    } catch (error) {
      console.error("Error in registring user. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;
        // If the code was 409, we display a custom message for the duplicate user.
        if (statusCode === 409) {
          // ✅ Return a specific error message for the component to handle
          return {
            statusCode: 409,
            success: false,
            message: "An account with this email already exists.",
          };
        }
        // If the code was 422, we display a custom message for the validation error.
        else if (statusCode === 422) {
          errorMessage = error.response.data.message;
        } else if (statusCode === 429) {
          errorMessage = "Too many requests. Please try again later.";
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

      toast.error(errorMessage, {
        //The toastId can be any unique string.
        toastId: "toastId",
      });
      return { success: false }; // Return success status
    }
  },
  /**
   * Handles user login.
   * Sends credentials to backend and manages success/error states.
   */
  login: async ({ email, password }) => {
    try {
      const res = await axios.post("/auth/login", { email, password });
      set({ user: res.data, loading: false });
      toast.success("Login successful!");
      return { success: true }; // Return success status
    } catch (error) {
      console.error("Error in logging in. Please try again.");
      let errorMessage = "An unknown error occurred.";

      // Check for a response from the server
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 404) {
          return {
            statusCode: 404,
            success: false,
            message: "User not found. Please check your email.",
          };
        } else if (statusCode === 401) {
          return {
            statusCode: 401,
            success: false,
            message: "Invalid credentials. Please check your inputs.",
          };
        } else if (statusCode === 429) {
          errorMessage = "Too many requests. Please try again later.";
        } else {
          // Handle other server errors (like 500)
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // Network error handling
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage, {
        //The toastId can be any unique string.
        toastId: "toastId",
      });
      return { success: false }; // Return success status
    }
  },
  /**
   * Handles user logout.
   * Clears user data in frontend and informs backend.
   */
  logout: async () => {
    set({ loading: true });
    try {
      await axios.post("/auth/logout");
      set({ user: null, loading: false });
      toast.success("You have been logged out successfully!");
    } catch (error) {
      set({ loading: false });
      console.error("Error in logging out. Please try again.");

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

      toast.error(errorMessage, {
        //The toastId can be any unique string.
        toastId: "toastId",
      });
    }
  },
  /**
   * Checks user's authentication status with the backend on app load/refresh.
   */
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      set({ checkingAuth: false, user: null });
      console.error("Error in checking authentication. Please try again.");
      // A variable to store the error message.
      let errorMessage =
        "An unknown error occurred during authentication check.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        // Check for specific error status codes
        if (statusCode === 401) {
          // The server sends a 401 error if there is no token, an invalid token, or the user is not found.
          errorMessage = "Unauthorized. Please log in to access this page.";
        } else if (statusCode >= 500) {
          // Handle a general server error (e.g., database connection issues).
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received (network error or CORS issue).
        errorMessage = "Network error. Please check your internet connection.";
      }
      console.log(errorMessage); // Use console.log for debugging purposes.
      // Display a toast message to the user if needed, but it's often not necessary for checkAuth.
      // toast.error(errorMessage);
    }
  },
  /**
   * Refreshes the access token using the refresh token.
   * Crucial for maintaining user sessions without re-login.
   */
  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    // Sending two requests for token-related tasks at the same time is an unnecessary burden on the server.
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      console.error("Error in refreshing token. Please try again.");
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred during token refresh.";

      // Check for a response from the server.
      if (error.response) {
        const statusCode = error.response.status;

        if (statusCode === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (statusCode >= 500) {
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error).
        errorMessage = "Network error. Please check your internet connection.";
      }

      // displaying a toast to the user is usually not necessary and we just log the error to the console.
      console.log(errorMessage);

      // throw error;
      // If you don't throw error;, the refreshToken function returns a Promise that resolves to undefined.
      // The interceptor sees this as a successful resolution.
      // The interceptor then tries to resend the original API request, but it still fails because the token wasn't actually refreshed. This creates an infinite loop of failed requests.
      throw error;
    }
  },
}));

// By adding throw error;, you ensure that the refreshToken function correctly propagates the error back to the interceptor, telling it that the refresh operation failed. This allows the interceptor to stop the infinite loop and redirect the user to the login page.
