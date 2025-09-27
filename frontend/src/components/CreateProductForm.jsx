import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, XCircle } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  "jeans",
  "t-shirts",
  "shoes",
  "glasses",
  "jackets",
  "suits",
  "bags",
];
const productSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long." }),
  price: z
    .number({
      invalid_type_error: "Price must be a number.", //Custom Error for type mismatch
    })
    .min(0, { message: "Price cannot be a negative number." }),
  category: z.string().min(1, { message: "Please select a category." }),
  // `any()` is used because the image is a `File` object, not a string or number
  image: z
    .instanceof(File, { message: "Image is required." })
    .refine((file) => file.size <= 5 * 1024 * 1024, "Max image size is 5MB."),
  stock: z
    .number({
      invalid_type_error: "Stock must be a number.",
    })
    .min(0, { message: "Stock cannot be a negative number." })
    .optional()
    .default(0), // ✅ Make it optional and set a default value of 0
});
const CreateProductForm = ({ onSuccess }) => {
  const { createProduct } = useProductStore();

  // 1. Define the Zod schema for form validation
  // We'll put this at the top of the component file, or in a separate validation file.

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue, // ✅ Get setValue to manually set the image value
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      image: null,
      stock: 0, // ✅ Add stock to default values
    },
  });
  // Using watch allows you to access the current value of the image field. When a user selects a file, watch captures the new value, triggering a component re-render.
  // This re-render enables us to use URL.createObjectURL to create a temporary, in-memory URL for the file and display it in an <img> tag.

  // Watch for the image file to update the preview
  const imageFile = watch("image");
  // A helper function to create the image URL for preview
  const imageUrl =
    imageFile instanceof File ? URL.createObjectURL(imageFile) : null;
  useEffect(() => {
    // This is important to clean up the temporary URL to prevent memory leaks
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const onSubmit = async (data) => {
    // ✅ Form data is now validated and ready
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", data.price);
    formData.append("category", data.category);
    // Append the file object directly: This is because Zod and react-hook-form have already done the validation for us.
    formData.append("image", data.image);
    formData.append("stock", data.stock);

    const result = await createProduct(formData);

    if (result.success) {
      reset();
      onSuccess();
    }
  };

  // The multipart/form-data approach you chose is generally considered more efficient for file uploads than a Base64 approach.
  const handleImageChange = (e) => {
    // ✅ Manually set the image file value in react-hook-form
    if (e.target.files.length > 0) {
      setValue("image", e.target.files[0], { shouldValidate: true });
    }
    // Immediately clear the native input value
    e.target.value = null; // ✅ This line would work here
    // const file = e.target.files[0];
    // if (file) {
    //   // It uses the FileReader API to read the contents of the selected image file.
    //   const reader = new FileReader();

    //   // This event handler fires when the file reading is complete.
    //   // Inside, it updates the image property in the newProduct state with the Base64 string (reader.result).
    //   reader.onloadend = () => {
    //     setNewProduct({ ...newProduct, image: reader.result });
    //   };
    //   // This method reads the file and encodes it as a Base64 string.
    //   // This string is a text representation of the image, which can be stored in the state.
    //   reader.readAsDataURL(file); // base64
    // }
  };
  const handleRemoveImage = () => {
    // ✅ Manually reset the image value
    setValue("image", null, { shouldValidate: true });
    // we could clear the input value here
    // You can also reset the native input value here for robustness
    // const fileInput = document.getElementById("image");
    // if (fileInput) {
    //   fileInput.value = "";
    // }
  };

  return (
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-semibold mb-6 text-emerald-300">
        Create New Product
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-300"
          >
            Product Name
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.name && (
            <span className="text-red-400 text-xs mt-1">
              {errors.name.message}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows="3"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm
						 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 
						 focus:border-emerald-500"
          />
          {errors.description && (
            <span className="text-red-400 text-xs mt-1">
              {errors.description.message}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-300"
          >
            Price
          </label>
          <input
            type="number"
            id="price"
            // Reading the value from the <input type="number"> as a string.
            // Immediately converting to a number before updating the form's state.
            {...register("price", { valueAsNumber: true })}
            step="0.01"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
						py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
						 focus:border-emerald-500"
          />
          {errors.price && (
            <span className="text-red-400 text-xs mt-1">
              {errors.price.message}
            </span>
          )}
        </div>
        {/* ✅ Add stock input field */}
        <div>
          <label
            htmlFor="stock"
            className="block text-sm font-medium text-gray-300"
          >
            Stock
          </label>
          <input
            type="number"
            id="stock"
            {...register("stock", { valueAsNumber: true })}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
            py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
             focus:border-emerald-500"
          />
          {errors.stock && (
            <span className="text-red-400 text-xs mt-1">
              {errors.stock.message}
            </span>
          )}
        </div>
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-300"
          >
            Category
          </label>
          <select
            id="category"
            {...register("category")}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
						 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="text-red-400 text-xs mt-1">
              {errors.category.message}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-col items-start space-y-1">
          <div className=" flex flex-col items-center space-y-1 relative">
            {/* You can't use register directly with a file input because it only handles simple values like strings and numbers, but a file input returns a special File object. */}
            <input
              type="file"
              id="image"
              // The sr-only class (a Tailwind CSS utility) hides the file input from the visual interface while keeping it accessible to screen readers.
              className="sr-only"
              accept="image/*"
              // the presence of required causes interference. This problem is due to the way forms work in React.
              // required
              onChange={handleImageChange}
            />
            <label
              htmlFor="image"
              className="cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex flex-col gap-2 "
            >
              {/* The image preview will be displayed here */}
              {/* This line uses the URL.createObjectURL() API(built-in browser API) to create a temporary URL for the selected file, allowing you to display a preview of the image instantly on the frontend. This is a big win for user experience.*/}
              <img
                src={imageUrl ? imageUrl : "/upload_area3-removebg-preview.png"}
                alt="Product Preview"
              />
              {!imageUrl && (
                <div className="flex items-center justify-center">
                  <Upload className="h-5 w-5 inline-block mr-2" />
                  Upload Image
                </div>
              )}
            </label>
            {imageUrl && (
              <button
                onClick={handleRemoveImage}
                type="button" // ✅ Use type="button" to prevent form submission
                className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
              >
                <XCircle className="h-4 w-4" /> {/* Use the icon component */}
              </button>
            )}
            {imageUrl && (
              <span className="text-sm text-gray-400">Image uploaded</span>
            )}
            {errors.image && (
              <span className="text-red-400 text-xs mt-1">
                {errors.image.message}
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader
                className="mr-2 h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              Loading...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
export default CreateProductForm;
