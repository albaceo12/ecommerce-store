import { BarChart, PlusCircle, ShoppingBasket, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import CreateCouponForm from "../components/CreateCouponForm";

const tabs = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "coupons", label: "Create Coupon", icon: Gift },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create"); // ✅ This function will be called on successful product creation
  useEffect(() => {
    // Scroll to the top of the page on the initial load with a slight delay
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100); // ✅ A small delay of 100ms should be enough
  }, []); // The empty array ensures this runs only once
  const handleProductCreated = () => {
    setActiveTab("products");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.h1
          className="text-4xl font-bold mb-8 text-emerald-400 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Admin Dashboard
        </motion.h1>

        <div className="flex justify-center mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "create" && (
          <CreateProductForm onSuccess={handleProductCreated} />
        )}
        {activeTab === "products" && <ProductsList />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "coupons" && <CreateCouponForm />}
      </div>
    </div>
  );
};
export default AdminPage;
