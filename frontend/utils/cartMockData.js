import { productsMockData } from "./productsMockData.js";
// A simple mock for axios that simulates API calls.

// The 'async' keyword is a special feature in JavaScript that simplifies working with Promises.
// It automatically wraps any value returned from the function in a new, resolved Promise.
// It also allows the use of the 'await' keyword inside the function, making asynchronous code look and behave like synchronous code.
// In short, you don't need to manually create and return a Promise; 'async' handles it for you.

const cartMockData = {
  // Simulate the current user to test exclusive coupons
  currentUser: { _id: "user_12345" },
  // Simulate user orders to test the "First Purchase" coupon
  mockOrders: [{ user: "user_12345", _id: "order_1" }],
  // If you want to test the "first purchase" coupon, empty the above array: mockOrders: []

  // This array simulates the shopping cart database on the server
  cartData: [
    {
      _id: "p1",
      name: "Laptop Pro",
      description: "A powerful laptop for professionals.",
      price: 1200,
      image: "https://placehold.co/150x150/000000/FFFFFF?text=Laptop",
      category: "Electronics",
      isFeatured: true,
      publicId: "public-id-laptop",
      stock: 10,
      quantity: 1,
    },
    {
      _id: "p2",
      name: "Mechanical Keyboard",
      description: "A durable mechanical keyboard for gamers.",
      price: 75,
      image: "https://placehold.co/150x150/000000/FFFFFF?text=Keyboard",
      category: "Accessories",
      isFeatured: false,
      publicId: "public-id-keyboard",
      stock: 25,
      quantity: 2,
    },
  ],

  // Simulate product database for inventory check
  mockProducts: productsMockData.products,
  // mockProducts: [
  //   {
  //     _id: "p1",
  //     name: "Laptop Pro",
  //     description: "A powerful laptop for professionals.",
  //     price: 1200,
  //     image: "https://placehold.co/150x150/000000/FFFFFF?text=Laptop",
  //     category: "Electronics",
  //     isFeatured: true,
  //     publicId: "public-id-laptop",
  //     stock: 10,
  //   },
  //   {
  //     _id: "p2",
  //     name: "Mechanical Keyboard",
  //     description: "A durable mechanical keyboard for gamers.",
  //     price: 75,
  //     image: "https://placehold.co/150x150/000000/FFFFFF?text=Keyboard",
  //     category: "Accessories",
  //     isFeatured: false,
  //     publicId: "public-id-keyboard",
  //     stock: 25,
  //   },
  //   {
  //     _id: "p3",
  //     name: "Gaming Mouse",
  //     description: "An ergonomic gaming mouse with customizable buttons.",
  //     price: 25,
  //     image: "https://placehold.co/150x150/000000/FFFFFF?text=Mouse",
  //     category: "Accessories",
  //     isFeatured: false,
  //     publicId: "public-id-mouse",
  //     stock: 0,
  //   },
  // ],
  // Simulate a coupon database with different coupon types
  mockCoupons: [
    {
      _id: "c1",
      code: "SAVE10",
      discountPercentage: 10,
      description: "10% off on all items",
      isActive: true,
      usageCount: 50,
      usageLimit: 100,
    },
    {
      _id: "c2",
      code: "FREE_SHIP",
      discountPercentage: 50,
      description: "Free shipping",
      isActive: true,
      expirationDate: new Date("2025-12-31"),
    },
    {
      _id: "c3",
      code: "EXPIRED_CODE",
      discountPercentage: 20,
      description: "This coupon is expired",
      isActive: true,
      expirationDate: new Date("2024-01-01"),
    },
    {
      _id: "c4",
      code: "DISABLED_CODE",
      discountPercentage: 30,
      description: "This coupon is disabled by admin",
      isActive: false,
      expirationDate: new Date("2025-12-31"),
    },
    {
      _id: "c5",
      code: "WELCOME_15",
      discountPercentage: 15,
      description: "Welcome offer for new users",
      isActive: true,
      userId: "user_12345", // This is an exclusive coupon for our mock user
    },
    {
      _id: "c6",
      code: "OTHER_USER",
      discountPercentage: 10,
      description: "A coupon for another user",
      isActive: true,
      userId: "another_user_id", // This should not be returned
    },
  ],
  // GET, POST, PUT, DELETE methods
  get: async (url) => {
    console.log(`MOCK AXIOS: GET ${url}`);
    if (url === "/cart") {
      return { data: cartMockData.cartData };
    }
    if (url === "/coupons") {
      const activeCoupons = cartMockData.mockCoupons.filter((coupon) => {
        const isNotExpired =
          !coupon.expirationDate ||
          new Date(coupon.expirationDate) > new Date();
        const isPublicOrExclusive =
          !coupon.userId || coupon.userId === cartMockData.currentUser._id;

        return coupon.isActive && isNotExpired && isPublicOrExclusive;
      });
      return { data: activeCoupons };
    }
    throw new Error("MOCK AXIOS: Route not found");
  },
  post: async (url, data) => {
    console.log(`MOCK AXIOS: POST ${url}`, data);
    if (url === "/coupons/validate") {
      const { code } = data;
      const coupon = cartMockData.mockCoupons.find((c) => c.code === code);

      // Check 1: Coupon exists and is active
      if (!coupon || !coupon.isActive) {
        throw {
          response: { status: 404, data: { message: "Coupon is invalid." } },
        };
      }

      // Check 2: Expiration date
      if (
        coupon.expirationDate &&
        new Date(coupon.expirationDate) < new Date()
      ) {
        throw {
          response: { status: 410, data: { message: "Coupon expired" } },
        };
      }

      // Check 3: First-purchase coupon
      if (coupon.code === "FIRST_PURCHASE") {
        const hasOrders = cartMockData.mockOrders.some(
          (order) => order.user === cartMockData.currentUser._id
        );
        if (hasOrders) {
          throw {
            response: {
              status: 403,
              data: {
                message: "This coupon is only for first-time purchases.",
              },
            },
          };
        }
      }

      // Check 4: Exclusive coupon logic
      if (coupon.userId) {
        if (coupon.userId !== cartMockData.currentUser._id) {
          throw {
            response: {
              status: 403,
              data: { message: "This coupon is not for you." },
            },
          };
        }
        if (coupon.isUsed) {
          throw {
            response: {
              status: 404,
              data: { message: "Coupon has already been used." },
            },
          };
        }
      } else {
        // Check 5: Public coupon usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          throw {
            response: {
              status: 404,
              data: { message: "Coupon has reached its usage limit." },
            },
          };
        }
      }

      // Success
      return {
        data: {
          message: "coupon is valid",
          discountPercentage: coupon.discountPercentage,
          code: coupon.code,
        },
      };
    }
    if (url === "/cart") {
      const { productId } = data;
      const productExists = cartMockData.mockProducts.find(
        (p) => p._id === productId
      );

      if (!productExists) {
        throw {
          response: { status: 404, data: { message: "Product not found" } },
        };
      }

      if (productExists.stock < 1) {
        throw {
          response: {
            status: 422,
            data: {
              message: `Product "${productExists.name}" is out of stock at the moment.`,
            },
          },
        };
      }

      const existingItem = cartMockData.cartData.find(
        (item) => item._id === productId
      );
      if (existingItem) {
        throw {
          response: {
            status: 409,
            data: {
              message: `Product "${productExists.name}" is already in your cart. Use the update function to change its quantity.`,
            },
          },
        };
      }

      const newCartItem = {
        ...productExists,
        quantity: 1,
      };
      cartMockData.cartData = [...cartMockData.cartData, newCartItem];
      return { data: cartMockData.cartData };
    }
    throw new Error("MOCK AXIOS: Route not found");
  },
  put: async (url, data) => {
    console.log(`MOCK AXIOS: PUT ${url}`, data);
    const productId = url.split("/").pop();
    const { quantity } = data;

    const product = cartMockData.mockProducts.find((p) => p._id === productId);
    if (product && quantity > product.stock) {
      throw {
        response: {
          status: 422,
          data: {
            message: `Not enough stock for ${product.name}. Only ${product.stock} items are available at the moment.`,
          },
        },
      };
    }

    const existingItem = cartMockData.cartData.find(
      (item) => item._id === productId
    );
    if (!existingItem) {
      throw {
        response: {
          status: 404,
          data: { message: "the item is already gone" },
        },
      };
    }

    if (quantity === 0) {
      cartMockData.cartData = cartMockData.cartData.filter(
        (item) => item._id !== productId
      );
    } else {
      cartMockData.cartData = cartMockData.cartData.map((item) =>
        item._id === productId ? { ...item, quantity: quantity } : item
      );
    }
    return { data: cartMockData.cartData };
  },
  delete: async (url, data) => {
    console.log(`MOCK AXIOS: DELETE ${url}`, data);
    const { productId } = data.data;
    const existingItem = cartMockData.cartData.find(
      (item) => item._id === productId
    );
    if (!existingItem) {
      throw {
        response: {
          status: 404,
          data: { message: "The item is already gone." },
        },
      };
    }
    cartMockData.cartData = cartMockData.cartData.filter(
      (item) => item._id !== productId
    );
    return { data: cartMockData.cartData };
  },
};
export default cartMockData;
