import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Loader,
  WifiOff,
} from "lucide-react";
import getAnalyticsData from "../../utils/analyticsMockData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// ✅ Define the isMock variable here, or in a separate config file
const isMock = true; // Set to 'false' to use the real backend
const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailySalesData, setDailySalesData] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        let response;
        if (isMock) {
          // ✅ Get data from the mock API
          response = await getAnalyticsData();
        } else {
          // ✅ Get data from the real backend API
          response = await axios.get("/analytics");
        }
        // ✅ A common bug fix: Check if 'data' property exists.
        // It helps to handle both real and mock API responses gracefully.
        const fetchedData = response.data ? response.data : response;
        // ✅ Transform the data to include a 'name' key for the XAxis
        const transformedData = fetchedData.dailySalesData.map((item) => ({
          ...item,
          // ✅ Use the 'date' property as the 'name' key in order to match the XAxis
          name: new Date(item.date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
          }),
        }));
        setAnalyticsData(fetchedData.analyticsData);
        setDailySalesData(transformedData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setError(
          "Failed to fetch analytics data. Please check your connection."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader className="animate-spin mr-3 text-emerald-400" />
        <span className="text-gray-300">Loading analytics data...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-400">
        <WifiOff className="h-12 w-12 text-red-500 mb-4" />
        <span className="text-lg font-semibold">{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Total Users"
          value={analyticsData.users.toLocaleString()}
          icon={Users}
          color="from-emerald-500 to-teal-700"
        />
        <AnalyticsCard
          title="Total Products"
          value={analyticsData.products.toLocaleString()}
          icon={Package}
          color="from-emerald-500 to-green-700"
        />
        <AnalyticsCard
          title="Total Sales"
          value={analyticsData.totalSales.toLocaleString()}
          icon={ShoppingCart}
          color="from-emerald-500 to-cyan-700"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`$${analyticsData.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="from-emerald-500 to-lime-700"
        />
      </div>
      <motion.div
        className="bg-gray-800/60 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#D1D5DB" />
            <YAxis yAxisId="left" stroke="#D1D5DB" />
            <YAxis yAxisId="right" orientation="right" stroke="#D1D5DB" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#10B981"
              activeDot={{ r: 8 }}
              name="Sales"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              activeDot={{ r: 8 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};
export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    className={`bg-gray-800 rounded-lg p-6 shadow-lg overflow-hidden relative ${color}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex justify-between items-center">
      <div className="z-10">
        <p className="text-emerald-300 text-sm mb-1 font-semibold">{title}</p>
        <h3 className="text-white text-3xl font-bold">{value}</h3>
      </div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-900 opacity-30" />
    <div className="absolute -bottom-4 -right-4 text-emerald-800 opacity-50">
      <Icon className="h-32 w-32" />
    </div>
  </motion.div>
);
