import { motion } from "framer-motion";
import { Trash, Star, Loader, WifiOff } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useEffect, useState } from "react";
const ProductsList = () => {
  const {
    deleteProduct,
    toggleFeaturedProduct,
    products,
    fetchAllProducts,
    currentPage,
    totalPages,
    totalProducts,
    hasNextPage,
    loading,
    error,
  } = useProductStore();
  // ✅ useEffect to scroll to the top when the page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // For a smooth scrolling animation
    });
  }, [currentPage]); // Dependency on currentPage ensures this runs whenever the page number changes

  // ✅ Create a local state to track the loading product
  const [updatingProductId, setUpdatingProductId] = useState(null);
  // ✅ Add a new local state for the deleting product
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [sortOptions, setSortOptions] = useState({
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  // ✅ Call fetchAllProducts with a default page when the component mounts
  useEffect(() => {
    // Note: We'll modify the fetchAllProducts store action to accept these parameters.
    fetchAllProducts(
      currentPage,
      sortOptions.sortBy,
      sortOptions.sortDirection
    );
  }, [fetchAllProducts, currentPage, sortOptions]); // The dependency array ensures it only runs once on mount.
  // ✨ Check the loading status
  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader className="animate-spin mr-3 text-emerald-400" />
        <span className="text-gray-300">Loading products...</span>
      </div>
    );
  }
  // ✨ Check the error status
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-400">
        <WifiOff className="h-12 w-12 text-red-500 mb-4" />
        <span className="text-lg font-semibold">{error}</span>
      </div>
    );
  }

  if (products?.length === 0) {
    return (
      <div className="py-6 text-center text-gray-400">No products found!</div>
    );
  }

  // ✅ Create a new async function to handle the update
  const handleToggleFeatured = async (productId) => {
    setUpdatingProductId(productId); // Set the loading state for this specific product
    try {
      await toggleFeaturedProduct(productId);
    } catch (error) {
      console.error("Toggle featured failed:", error);
    } finally {
      // ✅ GUARANTEE that the updating state is cleared..
      //without putting finally if it fails, it throws an error and does not proceed and the state is not cleared
      setUpdatingProductId(null);
    }
  };

  // ✅ Create a new async function to handle the delete action
  const handleDeleteProduct = async (productId) => {
    // Set the local state to the ID of the product being deleted
    setDeletingProductId(productId);
    try {
      await deleteProduct(productId);
    } catch (error) {
      console.error("Deletion failed:", error);
    } finally {
      // ✅ GUARANTEE that the deleting state is cleared
      setDeletingProductId(null);
    }
  };

  // ✅ New functions to handle sorting changes
  const handleSortChange = (e) => {
    setSortOptions((prev) => ({ ...prev, sortBy: e.target.value }));
  };

  const handleDirectionChange = () => {
    setSortOptions((prev) => ({
      ...prev,
      sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Sort By:</span>
          {/* ✅ Dropdown menu for sorting criteria */}
          <select
            value={sortOptions.sortBy}
            onChange={handleSortChange}
            className="bg-gray-700 text-gray-300 border-none rounded px-2 py-1"
          >
            <option value="createdAt">Date</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
          {/* ✅ Sort button */}
          <button
            onClick={handleDirectionChange}
            className="bg-gray-700 text-gray-300 rounded-md px-2 py-1 hover:bg-gray-600"
          >
            {sortOptions.sortDirection === "asc" ? "⬆️ Asc" : "⬇️ Desc"}
          </button>
        </div>
      </div>
      <table className=" min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Product
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Category
            </th>

            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Featured
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {products?.map((product) => (
            <tr key={product._id} className="hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={product.image}
                      alt={product.name}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-white">
                      {product.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">
                  ${product.price.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">{product.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleToggleFeatured(product._id)}
                  disabled={updatingProductId === product._id} // ✅ Disable while updating
                  className={`p-1 rounded-full relative ${
                    product.isFeatured
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-600 text-gray-300"
                  } hover:bg-yellow-500 transition-colors duration-200`}
                >
                  {updatingProductId === product._id ? (
                    // ✅ Show a loader for the specific button
                    <Loader className="h-5 w-5 animate-spin text-gray-900" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleDeleteProduct(product._id)}
                  disabled={deletingProductId === product._id}
                  className="text-red-400 hover:text-red-300"
                >
                  {deletingProductId === product._id ? (
                    // ✅ Show a spinner for the specific button
                    <Loader className="h-5 w-5 animate-spin text-red-400" />
                  ) : (
                    <Trash className="h-5 w-5" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* ✅ Pagination Controls */}
      <div className="flex justify-between items-center px-6 py-4">
        <button
          onClick={() => fetchAllProducts(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          Previous
        </button>
        {/* <span className="text-gray-400 text-sm">Page {currentPage}</span> */}
        <span className="text-gray-400 text-sm">
          Page {currentPage} of {totalPages} ({products.length} of{" "}
          {totalProducts})
        </span>
        <button
          onClick={() => fetchAllProducts(currentPage + 1)}
          disabled={!hasNextPage} // ✅ Check the new flag
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};
export default ProductsList;
