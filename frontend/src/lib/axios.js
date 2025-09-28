import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.mode === "development"
      ? "http://localhost:5000/api"
      : "https://ecommerce-store-backend-qed4.onrender.com/api",
  withCredentials: true, // send cookies to the server
});

export default axiosInstance;

// "http://localhost:5000/api" ---This is your backend address in the development environment.

// If the project is in Production mode, the baseURL changes to /api.
// In a production environment, the frontend and backend are usually on the same server, so you don't need to specify the full URL.
// This will make requests to the relative URL yourwebsite.com/api.

// *************************************

// You don't define import.meta.mode anywhere. It's a default environment variable that Vite automatically provides.

// If you run the project with the npm run dev or vite command, the value of import.meta.mode will be equal to "development".

// If you run the project with the npm run build command, the value of import.meta.mode will be equal to "production".

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
