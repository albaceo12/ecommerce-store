// Add this function to your mockApi.js file

const getAnalyticsData = () => {
  return new Promise((resolve) => {
    // ⏰ Simulate a network delay of 500ms
    setTimeout(() => {
      const analyticsData = {
        users: 1258,
        products: 450,
        totalSales: 875,
        totalRevenue: 124500,
      };

      const today = new Date();
      const dailySalesData = Array.from({ length: 7 })
        .map((_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - index);
          const formattedDate = date.toISOString().split("T")[0];
          return {
            date: formattedDate,
            sales: Math.floor(Math.random() * 100) + 1,
            revenue: Math.floor(Math.random() * 5000) + 100,
          };
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort to ensure chronological order

      resolve({
        analyticsData,
        dailySalesData,
      });
    }, 500);
  });
};

export default getAnalyticsData;
