import User from "../models/user.model.js";
import Product from "../models/product.model.js";
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const { user } = req;

    // ✅ Check if the product exists in the database
    // You should never trust information coming from the frontend (the user's browser).
    // A malicious user can easily send a fake or invalid productId to the backend using the Developer Tools in their browser.

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }
    // ✅ Check if the product is already in the cart.
    const existingItem = user.cartItems.find(
      // if (item.product.equals(productId)) ✔️ Special ObjectId method for comparison - you can compare like this too
      (item) => item.product.toString() === productId
    );
    if (existingItem) {
      // If the item exists, tell the user to use the update function instead.
      return res.status(409).json({
        message: `Product "${productExists.name}" is already in your cart. Use the update function to change its quantity.`,
      });
    }
    // ✅ Check if there is at least one item in stock.
    if (productExists.stock < 1) {
      // 422 is for resources that exist, but the conditions are not met to process your request (for example, its inventory has reached zero).
      return res.status(422).json({
        message: `Product "${productExists.name}" is out of stock at the moment.`,
      });
    }

    // ✅ Add the new item to the cart with quantity of 1.
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          cartItems: {
            product: productId,
            quantity: 1,
            price: productExists.price,
          },
        },
      },
      { new: true, runValidators: true }
    ).populate("cartItems.product");

    res.json(updatedUser.cartItems);
  } catch (error) {
    console.log("error in add to cart controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const { user } = req;
    // Checking for the existence of an item in the shopping cart before performing a database operation
    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );
    // A race condition is a scenario where two actions happen almost simultaneously.
    // a user could have two browser tabs open. They delete an item in one tab, and then immediately try to delete it again in the other tab.

    // however If the item is already gone, $pull simply does nothing and the operation completes successfully. There's no need for an explicit check for the existence of the item.

    if (!existingItem) {
      // If the item does not exist, return a 404 error.
      return res.status(404).json({ message: "the item is already gone" });
    }
    // user.cartItems = user.cartItems.filter(
    //   (item) => item.product.toString() !== productId
    // );
    // await user.save();
    // res.json(user.cartItems);

    // A more efficient way to remove and item from cart
    // Using $pull to remove items from the cartItems array
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $pull: { cartItems: { product: productId } } },
      { new: true } // Return the updated document
    ).populate("cartItems.product");

    res.json(updatedUser.cartItems);
  } catch (error) {
    console.log("error in remove all from cart controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const { quantity } = req.body;
    const { user } = req;

    // First, we check whether the item exists through user.cartItems.
    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (!existingItem) {
      return res.status(404).json({ message: "the item is already gone" });
    }

    // ✅ Fetch the latest product details from the database
    const product = await Product.findById(productId);
    if (!product) {
      // This scenario should be rare, but it's a good safety check
      return res.status(404).json({ message: "The product no longer exists" });
    }
    // ✅Critical Stock Check // We use 422 here, as we discussed, because the request is unprocessable
    if (product.stock < quantity) {
      return res.status(422).json({
        message: `Not enough stock for ${product.name}. Only ${product.stock} items are available at the moment.`,
      });
    }
    let updatedUser;
    if (quantity === 0) {
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $pull: { cartItems: { product: productId } } },
        { new: true }
      );
    } else {
      updatedUser = await User.findOneAndUpdate(
        { _id: user._id, "cartItems.product": productId },
        { $set: { "cartItems.$.quantity": quantity } },
        { new: true, runValidators: true }
      );
    }

    const populatedUser = await updatedUser.populate("cartItems.product");
    return res.json(populatedUser.cartItems);
  } catch (error) {
    console.log("error in update quantity controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const getCart = async (req, res) => {
  try {
    const { user } = req;

    //  req.user is a Mongoose document
    //  populate() is a method available on Mongoose documents
    //  populate() mutate inside a function handler req.user so no need to assign it to a new variable

    // Does populate("cart Items.product") give an error on an empty array? ans: ❌ No, it is completely safe.So let's keep it that way — simple, safe, and effective ✅

    // If req.user.cartItems is an empty array:
    // ✅ So map() doesn't enter the function body at all, and the output is direct: cartItems = []
    // 📌 So in this case: item.quantity is not executed. item.product.toString() is not executed. No error occurs and the result will be completely safe and empty.

    // Populate and store the result in a variable
    const populatedUser = await user.populate("cartItems.product"); //    This handles the realistic scenario of a product being deleted by an admin.

    // ✅ 2. Filter out any items where the product no longer exists in the database.
    const cartItems = populatedUser.cartItems
      .filter((item) => item.product)
      .map((item) => ({
        quantity: item?.quantity || 1,
        ...item.product.toJSON(), // flatten product details
      }));

    res.json(cartItems);
  } catch (error) {
    console.log("error in get cart controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

// 1 - Suppose a product is deleted from the database, but its reference remains in the user's cartItems array. In this case, Mongoose sets the product field to null during the populate operation.
