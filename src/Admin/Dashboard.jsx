import React, {useContext,useState, useEffect } from "react";
import {
  FaBox,
  FaClipboardList,
  FaDownload,
  FaFileAlt,
  FaFileInvoice,
  FaStar,
  FaMoneyCheckAlt,
  FaWallet,
  FaCreditCard,
  FaMoneyBillWave,
} from "react-icons/fa";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { FaChartBar } from "react-icons/fa";
import { FaUserFriends } from "react-icons/fa";
import { Doughnut } from "react-chartjs-2";
import { ArcElement } from "chart.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from ".././firebase";
import { AuthContext } from "../Context/AuthContext";

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, ArcElement);

const data = {
  labels: ['Red', 'Blue', 'Green', 'Yellow'],
  datasets: [
    {
      label: 'T-Shirt Sales',
      data: [12, 19, 8, 15],
      backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24'],
      borderRadius: 8,
      barThickness: 30,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const Dashboard = () => {

  const {
    user,
  } = useContext(AuthContext);
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);


  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlySales, setMonthlySales] = useState(Array(12).fill(0));

  const [categorySalesData, setCategorySalesData] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const productsSnap = await getDocs(collection(db, "products"));
        const usersSnap = await getDocs(collection(db, "users"));
        const ordersSnap = await getDocs(collection(db, "orders"));
        const reviewsSnap = await getDocs(collection(db, "reviews"));
        const invoicesSnap = await getDocs(collection(db, "invoices"));

        setProductCount(productsSnap.size);
        setUserCount(usersSnap.size);
        setOrderCount(ordersSnap.size);
        setReviewCount(reviewsSnap.size);
        setInvoiceCount(invoicesSnap.size);
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));
        let orderTotal = snapshot.size;
        let itemsSold = 0;
        let revenue = 0;
        let monthlyTotals = Array(12).fill(0);

        snapshot.forEach((doc) => {
          const order = doc.data();

          // ✅ Sum quantities
          const cart = order.cart || [];
          const orderItemsQty = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
          itemsSold += orderItemsQty;

          // ✅ Add total amount (ensure numeric)
          revenue += parseFloat(order.total || 0);

          // ✅ Process order date (assumes `order.date` is in ISO string like "2025-07-12")
          if (order.date) {
            const orderDate = new Date(order.date);
            if (!isNaN(orderDate)) {
              const monthIndex = orderDate.getMonth(); // 0 for Jan
              monthlyTotals[monthIndex] += parseFloat(order.total || 0);
            }
          }
        });

        setOrderCount(orderTotal);
        setTotalItemsSold(itemsSold);
        setTotalRevenue(revenue);
        setMonthlySales(monthlyTotals);

      } catch (error) {
        console.error("Error fetching order stats:", error);
      }
    };

    fetchOrderStats();
  }, []);


  const [topSellingProducts, setTopSellingProducts] = useState([]);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));
        const orderData = snapshot.docs.map(doc => doc.data());

        const productSalesMap = {};

        orderData.forEach(order => {
          const items = order.products || []; 

          items.forEach(product => {
            const key = product.productId || product.name;

            if (!productSalesMap[key]) {
              productSalesMap[key] = {
                name: product.name,
                category: product.category,
                image: product.image,
                price: product.price,
                unitsSold: 0,
              };
            }

            productSalesMap[key].unitsSold += parseInt(product.quantity || 1);
          });
        });

        const sortedProducts = Object.values(productSalesMap)
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 5); // Top 5

        setTopSellingProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      }
    };

    fetchTopSellingProducts();
  }, []);


  const weeklyIncomeData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Income",
        data: [1200, 1800, 1100, 2800, 1900, 4900, 2800],
        backgroundColor: "rgba(59,130,246,0.6)",
        borderRadius: 8,
        barThickness: 30,
      },
    ],
  };

  const leadData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Leads",
        data: [200, 240, 180, 300],
        fill: false,
        borderColor: "#3b82f6",
        tension: 0.4,
      },
    ],
  };

  const metrics = [
    { label: "Total Sales", value: "", change: "-209", percent: "30.9%", down: true },
    { label: "Revenue", value: { totalRevenue }, change: "+$980", percent: "56.2%", down: false },
    { label: "Products", value: { productCount }, change: "+46", percent: "28.8%", down: false },
    { label: "Ads Spent", value: "$380", change: "-60", percent: "49.3%", down: true },
    { label: "Expenses", value: "$890", change: "+498", percent: "3.9%", down: false },
  ];


 const [notifications, setNotifications] = useState([]);

const fetchOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const todayStr = new Date().toISOString().split("T")[0];

    const data = snapshot.docs.map((doc) => {
      const order = doc.data();
      let createdAt = null;

      if (order.createdAt?.toDate) {
        createdAt = order.createdAt.toDate();
      } else if (typeof order.createdAt === "string") {
        createdAt = new Date(order.createdAt);
      }

      // Get first cart item for quick preview (optional)
      const firstItem = order.cart?.[0] || {};

      return {
        id: doc.id,
        ...order,
        createdAt,
        customerName: order.fullname || order.name || "Unknown",
        image: firstItem.image || firstItem.customizedImage || firstItem.images?.[0] || "/no-image.png",
        name: firstItem.name || "Product",
        price: firstItem.price || 0,
        time: createdAt?.toLocaleTimeString() || "Just now",
      };
    });

    const todayOrders = data.filter(
      (order) =>
        order.createdAt &&
        order.createdAt.toISOString().split("T")[0] === todayStr &&
        ["Placed", "Place Order"].includes(order.status)
    );

    setNotifications(todayOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

useEffect(() => {
  fetchOrders();
}, []);


  // Badge styling based on status
  const getStatusBadge = (status) => {
    const base = "text-xs font-semibold px-2 py-1 rounded-full";
    switch (status) {
      case "Placed":
        return `${base} bg-green-100 text-green-700`;
      case "Cancelled":
        return `${base} bg-red-100 text-red-700`;
      case "Pending":
        return `${base} bg-yellow-100 text-yellow-700`;
      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };


  const transactions = [
    {
      title: "Refund Bill Payment",
      time: "Today - 09:30am",
      amount: "$220.00",
      color: "bg-blue-100 text-blue-600",
      icon: <FaMoneyCheckAlt />,
    },
    {
      title: "Wallet Payment",
      time: "Today - 09:45am",
      amount: "$230.00",
      color: "bg-pink-100 text-pink-600",
      icon: <FaWallet />,
    },
    {
      title: "Credit Card Payment",
      time: "Today - 10:30am",
      amount: "$250.00",
      color: "bg-green-100 text-green-600",
      icon: <FaCreditCard />,
    },
    {
      title: "Cash Payment",
      time: "Today - 11:00am",
      amount: "$260.00",
      color: "bg-yellow-100 text-yellow-600",
      icon: <FaMoneyBillWave />,
    },
  ];

  const barData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Income",
        data: [1200, 2300, 1400, 2800, -3000, 5000, 3000],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderRadius: 5,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Leads",
        data: [200, 300, 250, 400, 350, 500, 480],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };





  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const topCategories = categoryList.slice(0, 5);

        const labels = topCategories.map((cat) => cat.cname || "Unnamed");
        const data = new Array(topCategories.length).fill(1);

        setCategorySalesData({
          labels,
          datasets: [
            {
              label: "Categories",
              data,
              backgroundColor: [
                "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#3B82F6",
              ],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const categorySalesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#4B5563",
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}`,
        },
      },
    },
  };


  return (
    <div className="px-3 py-6 bg-[#f4f7fe] min-h-screen space-y-8">
      {/* Header */}
      <div data-aos="fade-down" className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Hello {user.name},</h2>
          <p className="text-sm text-gray-500">Have a good day :)</p>
        </div>
        <div className="flex gap-8 mt-4 sm:mt-0">
          <div className="text-md text-black font-bold">
            <p>₹{(monthlySales.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}k</p>
            <p className="text-md text-gray-500">Yearly Sales</p>
          </div>
          <div className="text-md text-black font-bold">
            <p>₹. {totalRevenue.toFixed(0)}k</p>
            <p className="text-md text-gray-500">Overall Revenue</p>
          </div>
        </div>
      </div>





      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-0">
        {/* Best Seller Card */}
        <div data-aos="fade-right" className="bg-gray-900 text-white rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold">Congratulations {user.name} 🎉</h3>
            <p className="text-sm mt-1">You are the best seller of the month.</p>
          </div>
          <div className="mt-6 text-3xl font-bold">₹ 69.9k</div>

          <div>
            <img src="/happy.svg" alt="" />
          </div>
        </div>

        {/* T-Shirt Stats Graphic */}
        <div className="bg-white p-6 rounded-xl flex flex-col justify-between shadow-lg">
          <img
            src="/delivery.png"
            alt="T-shirt Delivery"
            className="w-full h-30 object-contain mb-4"
          />

          <div className="flex justify-between text-blue-600 font-semibold text-sm mb-6">
            <div>
              <p>Printed</p>
              <div className="h-2 bg-blue-300 mt-1 rounded-full w-[30px]"></div>
            </div>
            <div>
              <p>Plain</p>
              <div className="h-2 bg-blue-400 mt-1 rounded-full w-[40px]"></div>
            </div>
            <div>
              <p>Oversized</p>
              <div className="h-2 bg-blue-500 mt-1 rounded-full w-[50px]"></div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="relative h-40">
            <Bar data={data} options={options} />
          </div>

        </div>


        {/* Mini Stats */}
        <div data-aos="fade-left" className="grid grid-cols-2 gap-4">
          <Card count={totalItemsSold} label="Items Sold" icon={<FaBox />} color="blue" />
          <Card count={orderCount} label="New Orders" icon={<FaClipboardList />} color="purple" />
          <Card count="300" label="Downloads" icon={<FaDownload />} color="red" />
          <Card count="800" label="Documents" icon={<FaFileAlt />} color="green" />
          <Card count={productCount} label="Products" icon={<FaBox />} color="orange" />
          <Card count={invoiceCount} label="Invoices" icon={<FaFileInvoice />} color="yellow" />
        </div>
      </div>

      {/* Firebase-Driven Stat Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox
          title="Products"
          count={productCount}
          color="blue"
          icon={<FaBox size={50} className="text-white text-2xl border-2 p-2 rounded-lg" />}
        />
        <StatBox
          title="Orders"
          count={orderCount}
          color="red"
          icon={<FaClipboardList size={50} className="text-white text-2xl border-2 p-2 rounded-lg" />}
        />
        <StatBox
          title="Reviews"
          count={reviewCount}
          color="purple"
          icon={<FaStar size={50} className="text-white text-2xl border-2 p-2 rounded-lg" />}
        />
        <StatBox
          title="Users"
          count={userCount}
          color="green"
          icon={<FaUserFriends size={50} className="text-white text-2xl border-2 p-2 rounded-lg" />}
        />
      </div>


      <div className="p-2 bg-[#f7faff] min-h-screen space-y-6">
        {/* Cards: Sales, Revenue, Leads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sales Card */}
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="text-gray-500">Sales</div>
            <div className="text-sm text-gray-400 mb-2">Current Month</div>
            <Line
              data={lineData}

              options={{
                plugins: { legend: { display: false } },
                scales: { y: { display: false }, x: { display: false } },
                fill: true,
              }}
              height={60}
            />
            <div className="text-2xl font-bold mt-2">660k</div>
            <p className="text-blue-500 text-sm mt-1">+22% Higher</p>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="text-gray-500">$98.6K</div>
            <div className="text-sm text-gray-400 mb-2">Overall Revenue</div>
            <Bar
              data={{
                labels: ["A", "B", "C", "D", "E"],
                datasets: [
                  {
                    label: "Revenue",
                    data: [5, 10, 15, 20, 25],
                    backgroundColor: "#3b82f6",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { display: false }, x: { display: false } },
              }}
              height={60}
            />
            <div className="text-2xl font-bold mt-2">330k</div>
            <p className="text-blue-500 text-sm mt-1">+33% Higher</p>
          </div>

          {/* Leads Card */}
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="text-gray-500">Generated Leads</div>
            <div className="text-sm text-gray-400 mb-2">Weekly Report</div>
            <Line
              data={lineData}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { display: false }, x: { display: false } },
              }}
              height={60}
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FaChartBar className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Leads</div>
                  <div className="font-semibold text-sm">800</div>
                </div>
              </div>
              <div className="text-red-500 text-sm font-semibold">
                +206 <span className="text-xs">↑</span>
              </div>
            </div>
            <div className="text-xs text-red-400">30.3% Decrease</div>
          </div>
        </div>

        {/* Income & Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Income Bar */}
          <div className="bg-white rounded-xl p-2 shadow-sm col-span-2">
            <div className="text-lg font-semibold text-gray-700">Weekly Income</div>
            <p className="text-sm text-gray-400 mb-4">
              Highest income generated on Friday.
            </p>
            <Bar data={barData} options={barOptions} height={200} />
          </div>

          {/* Stats Summary */}
          <div className="bg-white rounded-xl p-2 shadow-sm space-y-4">
            {[
              {
                label: "Total Sales",
                value: 800,
                change: -209,
                percent: "30.9%",
                down: true,
              },
              {
                label: "Revenue",
                value: 6200,
                change: "+$980",
                percent: "56.2%",
                down: false,
              },
              {
                label: "Products",
                value: 630,
                change: "+46",
                percent: "28.8%",
                down: false,
              },
              {
                label: "Ads Spent",
                value: "$380",
                change: -60,
                percent: "49.3%",
                down: true,
              },
              {
                label: "Expenses",
                value: "$890",
                change: "+498",
                percent: "3.9%",
                down: false,
              },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaChartBar className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">{item.value}</div>
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${item.down ? "text-red-500" : "text-green-500"
                    }`}
                >
                  {item.change}
                  <div className="text-xs">
                    {item.percent} {item.down ? "↓" : "↑"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Orders and Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 px-2">
       <div className="bg-white p-6 rounded-xl shadow-md">
  <h3 className="text-xl font-semibold text-gray-800 mb-5">Recent Orders</h3>
  {notifications.length === 0 ? (
    <p className="text-gray-500 text-sm">No recent orders today.</p>
  ) : (
    notifications.map((order, idx) => (
      <div
        key={idx}
        className="flex items-center border-2 border-gray-300 mb-4 justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center gap-4">
          <img
            src={order.image}
            alt="shirt"
            className="w-12 h-12 object-cover rounded-lg"
          />
          <div>
            <p className="font-medium text-gray-900">{order.name}</p>
            <span className={getStatusBadge(order.status)}>{order.status}</span>
          </div>
        </div>
        <p className="font-semibold text-gray-900">₹{order.total}</p>
      </div>
    ))
  )}
</div>


        {/* Transactions Section */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">Latest Transactions</h3>
          {transactions.map((tx, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-4 "
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full text-black ${tx.color}`}
                >
                  {tx.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{tx.title}</p>
                  <p className="text-xs text-gray-500">{tx.time}</p>
                </div>
              </div>
              <p className={`font-semibold ${tx.amount.startsWith("-") ? "text-red-500" : "text-green-500"}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 px-2">
        {/* Top Category Sales */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Categories</h3>
          <div className="h-60 flex justify-center items-center">
            {categorySalesData ? (
              <Doughnut data={categorySalesData} options={categorySalesOptions} />
            ) : (
              <p className="text-gray-500">Loading chart...</p>
            )}
          </div>
        </div>
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topSellingProducts.length > 0 ? (
                  topSellingProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                        <img
                          src={product.image || "/no-image.png"}
                          alt={product.name || "Product"}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <span className="font-medium text-gray-800">{product.name || "Unnamed Product"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.category || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₹{product.price || "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {product.unitsSold || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No products sold yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};



const Card = ({ count, label, icon, color }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow  gap-4 relative">
      <div className={`w-10 h-10 flex items-center justify-center rounded-lg absolute top-[-10px] text-lg ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex items-center justify-center mt-5 flex-col">
        <p className="text-xl font-bold">{count}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
};

const StatBox = ({ title, count, color, icon }) => {
  const gradientMap = {
    blue: "bg-blue-600",
    red: "bg-red-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
  };
  return (
    <div className={`p-4 rounded-xl ${gradientMap[color]} text-white shadow-md flex flex-col justify-between`}>
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2">
        <div className="flex items-center gap-3 mb-0">
          <div className="text-2xl text-white">{icon}</div>
          <div className="flex flex-col">
            <div className="text-lg font-medium">{title}</div>
            <div className="text-3xl font-bold">{count}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;





