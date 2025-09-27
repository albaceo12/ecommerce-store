import Order from "../models/order.model.js";
import User from "../models/user.model.js";
export const getAnalytics = async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.json({ analyticsData, dailySalesData });
  } catch (error) {
    console.log("error in get analytics controller");
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};
async function getAnalyticsData() {
  // For repeated, high-frequency operations like pagination, countDocuments() is a bad choice.
  // For a one-time, multi-query dashboard fetch, it's the most reliable and efficient way to ensure accurate data.
  try {
    const [totalUsers, totalProducts, salesData] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      await Order.aggregate([
        {
          $group: {
            _id: null, // it will be null because we don't want to group by any field
            totalRevenue: { $sum: "$totalAmount" },
            totalSales: { $sum: 1 },
          },
        },
      ]),
    ]);
    // if we are runnning Order.aggregate on an empty Collection, the output will be an empty array [] instead of an array containing an object.
    const { totalRevenue, totalSales } = salesData[0] || {
      totalRevenue: 0,
      totalSales: 0,
    };

    return {
      users: totalUsers,
      products: totalProducts,
      totalRevenue,
      totalSales,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
async function getDailySalesData(startDate, endDate) {
  try {
    //This array only contains data from days that had sales.
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          sales: { $sum: 1 },
        },
      },
      { sort: { _id: 1 } },
    ]);

    //This array contains all the days in the time range, even the days that had no sales.
    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((data) => data._id === date);
      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (error) {
    throw new Error(error.message);
  }
}
// example of output for dailySalesData:
// [
// {_id: "2023-01-01", totalRevenue: 100, totalSales: 1},
// {_id: "2023-01-02", totalRevenue: 150, totalSales: 2},
// {_id: "2023-01-03", totalRevenue: 200, totalSales: 3},
//]

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate); // ✅ Create a copy to avoid side effects
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1); // after this operation currentDate will be one day ahead in new Date() fromat
  }
  return dates;
}

// exmple of output for getDatesInRange
// [
//   "2023-01-01","2023-01-02","2023-01-03","2023-01-04","2023-01-05","2023-01-06","2023-01-07","2023-01-08"
// ];

/*

a=new Date() ==> Mon Jun 16 2025 00:15:43 GMT+0330 (Iran Standard Time)
aa=a.getTime() ==> 1750020343420
new Date(aa) or new Date(a) ==> Mon Jun 16 2025 00:15:43 GMT+0330 (Iran Standard Time)

*/

// new Date().toISOString()...meaning toISOString() it will return the date in this format: "2023-01-01T00:00:00.000Z"  and its the method for new Date().toJSON() or just simple new Date()
