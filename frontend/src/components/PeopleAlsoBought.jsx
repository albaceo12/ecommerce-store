import { useEffect } from "react";
import ProductCard from "./ProductCard";
import LoadingSpinner from "./LoadingSpinner";
import { useProductStore } from "../stores/useProductStore";

const PeopleAlsoBought = () => {
  const { fetchRecommendedProducts, products, loading } = useProductStore();
  // const [recommendations, setRecommendations] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // const fetchRecommendations = async () => {
    //   try {
    //     const res = await axios.get("/products/recommendations");
    //     setRecommendations(res.data);
    //   } catch (error) {
    //     toast.error(
    //       error.response.data.message ||
    //         "An error occurred while fetching recommendations"
    //     );
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    fetchRecommendedProducts();
  }, []);

  // if (isLoading) return <LoadingSpinner />;
  if (loading) return <LoadingSpinner />;
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-emerald-400">
        People also bought
      </h3>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg: grid-col-3">
        {products?.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};
export default PeopleAlsoBought;
