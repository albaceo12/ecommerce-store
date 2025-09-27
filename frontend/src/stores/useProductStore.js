import { create } from "zustand";
import { toast } from "react-toastify";
import axios from "../lib/axios";
import { productsMockData } from "../../utils/productsMockData";

// ✅ A single flag to switch between mock and real API
const isMock = true;

// A more robust mock API with corrected logic
const mockApi = {
  // Simulates fetching a paginated list of products
  fetchProducts: (page, limit, sortBy, sortDirection) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // ✅ Create a copy of the array before sorting it because sorting modifies the original array
        let products = [...productsMockData.products];
        // ✅ Simulates sorting the mock data
        products.sort((a, b) => {
          if (a[sortBy] < b[sortBy]) return sortDirection === "asc" ? -1 : 1;
          if (a[sortBy] > b[sortBy]) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
        const totalProducts = products.length; // ✅ Get the total count from mock data
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);
        const hasNextPage = endIndex < products.length;

        resolve({
          products: paginatedProducts,
          hasNextPage,
          totalProducts,
          totalPages,
        });
      }, 500); // 500ms delay to simulate network latency
    });
  },

  // Simulates updating a product's 'isFeatured' status
  toggleFeatured: (productId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const productIndex = productsMockData.products.findIndex(
          (p) => p._id === productId
        );

        if (productIndex !== -1) {
          const productToUpdate = productsMockData.products[productIndex];
          productToUpdate.isFeatured = !productToUpdate.isFeatured;

          resolve({ isFeatured: productToUpdate.isFeatured });
        } else {
          reject(new Error("Product not found"));
        }
      }, 500);
    });
  },

  // Simulates deleting a product
  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const initialLength = productsMockData.products.length;
        // code only modifies the in-memory copy of that blueprint.(productsMockData.products)
        // When we refresh the page, the in-memory copy is erased and the original blueprint is loaded again.
        productsMockData.products = productsMockData.products.filter(
          (p) => p._id !== productId
        );

        if (productsMockData.products.length < initialLength) {
          resolve({ message: "Product deleted successfully" });
        } else {
          reject(new Error("Failed to delete product"));
        }
      }, 500);
    });
  },

  // ✅ Add a mock for creating a product
  createProduct: (formData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct = {
          _id: Date.now().toString(), // A simple mock ID
          name: formData.get("name"),
          price: parseInt(formData.get("price")),
          description: formData.get("description"),
          category: formData.get("category"),
          isFeatured: false,
          image:
            "https://images.unsplash.com/photo-1549419149-165b4c4f0b2f?q=80&w=1740&auto=format&fit=crop",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        productsMockData.products.push(newProduct);
        const totalProductsCount = productsMockData.products.length;
        resolve({
          product: newProduct,
          totalProductsCount,
        });
      }, 500);
    });
  },
  // ✅ Add mock for fetching featured products
  fetchFeaturedProducts: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const featuredProducts = productsMockData.products.filter(
          (p) => p.isFeatured
        );
        resolve(featuredProducts);
      }, 500);
    });
  },
  // ✅ Add mock for fetching recommended products
  fetchRecommendedProducts: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Randomly shuffle the products and take the first 3
        const recommendedProducts = [...productsMockData.products]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        resolve({ products: recommendedProducts });
      }, 500);
    });
  },

  // ✅ Add mock for fetching products by category
  fetchProductsByCategory: (category) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const productsByCategory = productsMockData.products.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
        resolve({ products: productsByCategory });
      }, 500);
    });
  },
};

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  isReadyForDisplay: false,
  error: null, // ✨ Add error status
  // ✅ Add state for pagination
  currentPage: 1,
  hasNextPage: false,
  totalProducts: 0,
  totalPages: 0,
  setProducts: (products) => set({ products }),
  createProduct: async (formData) => {
    try {
      let res;
      let totalProductsCount;

      if (isMock) {
        // ✅ Use the mock API for creation
        res = await mockApi.createProduct(formData);
        totalProductsCount = res.totalProductsCount;
      } else {
        res = await axios.post("/products", formData);
        totalProductsCount = res.data.totalProducts; // ✅ Get the total count from the response
      }

      // set((prevState) => ({
      //   products: [...prevState.products, res.data.product],
      // }));
      // ✨ Instead of adding locally, navigate to the last page
      const limit = 10;
      const newTotalPages = Math.ceil(totalProductsCount / limit);

      set({
        currentPage: 1,
        totalProducts: totalProductsCount,
        totalPages: newTotalPages,
      });

      // ✅ Fetch the last page, automatically showing the new product
      await get().fetchAllProducts(1, "createdAt", "desc");

      toast.success("Product created successfully!");
      return { success: true }; // Return success status
    } catch (error) {
      console.error("Error creating product:", error);

      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        // Check for specific error status codes
        if (400 <= statusCode && statusCode < 500) {
          errorMessage =
            error.response.data.message || "An unknown error occurred.";
        } else if (statusCode >= 500) {
          // Handle a general server error (e.g., database connection issues).
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
  fetchAllProducts: async (
    page = 1,
    sortBy = "createdAt",
    sortDirection = "desc"
  ) => {
    set({ loading: true, error: null }); // ✨ Clear previous error when starting fetch

    try {
      const limit = 10;
      let res;
      if (isMock) {
        res = await mockApi.fetchProducts(page, limit, sortBy, sortDirection);
      } else {
        res = await axios.get(
          `/products?page=${page}&limit=${limit}&sort=${sortBy}&direction=${sortDirection}`
        );
      }

      set({
        products: res?.products || res?.data?.products || [],
        loading: false,
        error: null,
        currentPage: page,
        hasNextPage: res?.hasNextPage || res?.data?.hasNextPage,
        totalProducts: res?.totalProducts || res?.data?.totalProducts,
        totalPages: res?.totalPages || res?.data?.totalPages,
      });
    } catch (error) {
      set({ loading: false });
      console.log("Error getting products:", error);
      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";
      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;
        // The backend only returns 500 in this controller
        if (statusCode >= 500) {
          // Handle a general server error (e.g., database connection issues).
          errorMessage =
            "An internal server error occurred. Please try again later.";
        }
      } else {
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }
      set({ error: errorMessage }); // ✨ Save error message in store
      toast.error(errorMessage, {
        //The toastId can be any unique string.
        toastId: "toastId",
      });
    }
  },
  fetchProductsByCategory: async (category) => {
    set({ loading: true, isReadyForDisplay: false });
    try {
      let res;
      if (isMock) {
        res = await mockApi.fetchProductsByCategory(category);
      } else {
        res = await axios.get(`/products/category/${category}`);
      }

      set({
        products: res?.products || res?.data?.products || [],
        loading: false,
        isReadyForDisplay: true,
      });
    } catch (error) {
      set({ loading: false, isReadyForDisplay: true });
      console.log("Error fetching products in this category:", error);

      // We define a variable to store the error message.
      let errorMessage = "An unknown error occurred.";

      // Check if a response has been received from the server.
      if (error.response) {
        const statusCode = error.response.status;

        // The backend only returns 500 in this controller
        if (statusCode >= 500) {
          // Handle a general server error (e.g., database connection issues).
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
  deleteProduct: async (productId) => {
    try {
      if (isMock) {
        await mockApi.deleteProduct(productId);
      } else {
        await axios.delete(`/products/${productId}`);
      }

      // ✅ Update the state to reflect the deletion
      const newProducts = get().products.filter((p) => p._id !== productId);
      const newTotalProducts = get().totalProducts - 1;

      // ✅ After successful deletion, update the local state to remove the product
      set((state) => ({
        ...state,
        products: newProducts,
        totalProducts: newTotalProducts,
        deletingProductId: null, // ✅ Reset the loading state
      }));
      // Check if the current page becomes empty after deletion
      if (newProducts.length === 0 && newTotalProducts > 0) {
        let newPage = get().currentPage;

        // If we are on the last page of products, go back one page.
        if (newPage > Math.ceil(newTotalProducts / 10)) {
          newPage = newPage - 1;
        }
        await get().fetchAllProducts(newPage);
      }
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.log("Error deleting product:", error);

      // We define a variable to store the error message.
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
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage, {
        //The toastId can be any unique string.
        toastId: "toastId",
      });
    }
  },
  toggleFeaturedProduct: async (productId) => {
    try {
      let res;
      if (isMock) {
        res = await mockApi.toggleFeatured(productId);
      } else {
        res = await axios.patch(`/products/${productId}`);
        set((state) => ({
          products: state.products.map((product) =>
            product._id === productId
              ? {
                  ...product,
                  isFeatured: res.isFeatured || res.data.isFeatured,
                }
              : product
          ),
        }));
      }
    } catch (error) {
      console.log("Error updating product:", error);

      // We define a variable to store the error message.
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
        // If no response was received from the server (network error)
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage, {
        //The toastId can be any unique string.
        toastId: "toastId",
      });
    }
  },
  fetchFeaturedProducts: async () => {
    set({ loading: true, isReadyForDisplay: false });
    try {
      let res;
      if (isMock) {
        res = await mockApi.fetchFeaturedProducts();
      } else {
        res = await axios.get("/products/featured");
      }

      set({
        products: res || res.data || [],
        loading: false,
        isReadyForDisplay: true,
      });
    } catch (error) {
      set({ loading: false, isReadyForDisplay: true });
      console.log("Error fetching featured products:", error);

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
  fetchRecommendedProducts: async () => {
    set({ loading: true, isReadyForDisplay: false });
    try {
      let res;
      if (isMock) {
        res = await mockApi.fetchRecommendedProducts();
      } else {
        res = await axios.get("/products/recommendations");
      }

      set({
        products: res?.products || res?.data?.products || [],
        loading: false,
        isReadyForDisplay: true,
      });
    } catch (error) {
      set({ loading: false, isReadyForDisplay: true });
      console.log("Error fetching recommended products:", error);

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
}));
