import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Identify any request that starts with /api.
      "/api": {
        // Send this request to my back-end address, http://localhost:5000.
        target: "https://ecommerce-store-backend-qed4.onrender.com", // ✅ A simple proxy to redirect /api requests
        changeOrigin: true, // The changeOrigin option tells the proxy to change the Host header(localhost:5173) of the incoming request to match the target URL.
        secure: false,
      },
    },
  },
});

// By doing this, Vite acts as an intermediary.
// In fact, Axios sends its request to http://localhost:5173/api/products,
// but the Vite server forwards the request to http://localhost:5000/api/products.

// In certain circumstances, when the /api/wahtever... path is not available,
// the Vite server By default, for undefined paths,redirect the request to the original index.html file and return it as a successful response (with code 200).

// This proxy ensures that any request starting with '/api' is correctly
// routed to the backend and does not fall back to the default behavior.

// when the internet is down, the request does not reach the back-end server and a real network error occurs, which Axios can catch and the error in Zustand is updated correctly.
