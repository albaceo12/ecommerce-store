import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import Counter from "../models/counter.model.js";
export const getAllProducts = async (req, res) => {
  //If the number of products increases, it can cause slowness and high server memory consumption.
  //Suggestion: Add pagination.
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const sort = req.query.sort || "createdAt";
  const direction = req.query.direction === "asc" ? 1 : -1;

  const skipIndex = (page - 1) * limit; //skipIndex is actually the number of documents to ignore.
  try {
    // ✅ Sort the products by creation date in descending order
    // This ensures the newest products are always at the top of the list
    const products = await Product.find({})
      .sort({ [sort]: direction })
      .skip(skipIndex)
      .limit(limit);
    // ✅ Get the total count from the Counter model
    const counterDoc = await Counter.findById("products_count");
    const totalProducts = counterDoc ? counterDoc.total_products : 0;
    const totalPages = Math.ceil(totalProducts / limit);

    // ✅ The correct way to check for a next page
    const hasNextPage = page * limit < totalProducts;

    res.json({
      products,
      hasNextPage,
      totalProducts,
      totalPages,
      page,
    });
  } catch (error) {
    console.log("error in get all products controller");
    res.status(500).json({
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};
export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }
    //.lean() is gonna return a plain js object instead of a mongodb document which is good for performance
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      // ✅ Consistency: Return an empty array instead of 404
      return res.json([]);
    }
    // store in redis for future access
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    console.log("error in get featured products controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const createProduct = async (req, res) => {
  try {
    // Image from Cloudinary
    req.body.image = req.cloudinaryImage.url;
    req.body.publicId = req.cloudinaryImage.public_id; // ✅ This line correctly adds the publicId

    const product = await Product.create(req.body);

    // ✅Update Redis cache after creating a featured product
    if (product.isFeatured) {
      await updateFeaturedProductsCache();
    }
    // ✅ Increment the counter atomically
    // If the counter document does not exist, it creates it and then increments it
    // If you do not set upsert: true , MongoDB will do nothing by default if the document does not exist( it witll throw an error ) and the update operation will fail.
    const counterDoc = await Counter.findByIdAndUpdate(
      "products_count",
      { $inc: { total_products: 1 } },
      { new: true, upsert: true } // ✅ Use upsert: true "Update or Insert"
    );
    res.status(201).json({ product, totalProducts: counterDoc.total_products });
  } catch (error) {
    // ❌ If the product is not made → delete the photo
    if (req.cloudinaryImage) {
      await cloudinary.uploader.destroy(req.cloudinaryImage.public_id);
    }
    console.log("error in create product controller");
    // validation for the errors: name,categroy,description,price
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return res
        .status(422)
        .json({ message: "Validation failed!", errors: errorMessages });
    }
    res.status(500).json({
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    /* The pop() method in JavaScript is used to remove the last element from an array. It modifies the original array by shortening it and returns the removed element. If the array is empty, pop() returns undefined without modifying the array. */

    /*example:==>product.image=a="https://res.cloudinary.com/dtgxxuswi/image/upload/v1749076295/products/brjfg8gexgcffcgvtlr3.png"

product.image.split("/").pop()----> brjfg8gexgcffcgvtlr3.png
*/
    // if (product.image) {
    //   const publicId = product.image.split("/").pop().split(".")[0];
    //   try {
    //     await cloudinary.uploader.destroy(publicId);
    //     console.log("deleted image from cloudinary");
    //   } catch (error) {
    //     console.log("error in deleting from cloudinary", error);
    //   }
    // }

    // The Cloudinary URL structure may change in the future. By storing the publicId in the database, you are no longer bound to this structure.
    // At large scales, deleting and replacing a field is faster than processing and slicing a string (String Manipulation).

    // ✅ Use the stored publicId directly for a robust deletion
    if (product.publicId) {
      try {
        await cloudinary.uploader.destroy(product.publicId);
        console.log("deleted image from cloudinary");
      } catch (error) {
        console.log("error in deleting from cloudinary", error);
      }
    }

    // ✅ Update Redis cache after deletion
    await updateFeaturedProductsCache();
    // ✅ Decrement the counter atomically
    await Counter.findByIdAndUpdate(
      "products_count",
      { $inc: { total_products: -1 } },
      { new: true }
    );

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("error in delete product controller");
    res.status(500).json({
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};
export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 3 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          image: 1,
          category: 1,
        },
      },
    ]);
    res.json({ products });
  } catch (error) {
    console.log("error in get recommended products controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};

export const getProductByCategory = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skipIndex = (page - 1) * limit; //skipIndex is actually the number of documents to ignore.
  try {
    const { category } = req.params;
    const products = await Product.find({ category })
      .skip(skipIndex)
      .limit(limit);
    res.json({ products });
  } catch (error) {
    console.log("error in get product by category controller");
    res.status(500).json({ message: "An internal server error occurred" });
  }
};
export const toggledFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.isFeatured = !product.isFeatured;
    const updatedproduct = await product.save();
    await updateFeaturedProductsCache();
    res.json(updatedproduct);
  } catch (error) {
    console.log("error in toggle featured product controller");
    res.status(500).json({
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};
async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update featured products cache");
  }
}

/* The $project stage is used to do this and to add any calculated fields that you need.

In this example, we only need the fields country, city, and name.

In the code that follows, please note that:

We must explicitly write _id : 0 when this field is not required */

//======================================
