import React, { useEffect, useState, useRef } from "react";
import {
  FaBars,
  FaTachometerAlt,
  FaBookOpen,
  FaUserPlus,
  FaClipboardList,
  FaUserFriends,
  FaBoxOpen,
  FaMoneyBillWave,
  FaFileAlt,
  FaBell,
  FaSearch,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import logo from "/Image/logo.png";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { FaHome } from "react-icons/fa";

// Component imports
import Dashboard from "./Dashboard";
import ProductList from "./Products/Products";
import NewUsers from "./Users/NewUsers";
import OldUsers from "./Users/OldUsers";
import AllOrders from "./Orders/AllOrders";
import DeliveryOrders from "./Orders/DeliveryOrders";
import CancelOrders from "./Orders/CancleOrders";
import Billing from "./Billing";
import Reviews from "./Reviews";

import AddStock from "./Stock/AddStock";
import StockDetails from "./Stock/StockDetails";
import Profile from "./Profile/Profile";
import AddProducts from "./Products/AddProducts";
import Invoice from "./Invoice";
import Category from "./Categorey";
import Dealers from "./Delears";
import GetOrdersDetails from "./GetOrdersDetails";
import { Link, useNavigate } from "react-router-dom";
import OurDesings from "./Products/OurDesings";

const tabLabels = {
  dashboard: { label: "Dashboard", icon: <FaTachometerAlt /> },
  products: {
    label: "Products",
    icon: <FaBookOpen />,
    isDropdown: true,
    children: {
      products: { label: "All Products", icon: <FaBookOpen /> },
      addProduct: { label: "Add Product", icon: <FaUserPlus /> },
      category: { label: "Category", icon: <FaFileAlt /> },
      ourDesigns: { label: "Our Designs", icon: <FaUserPlus /> },
    },
  },
  orders: {
    label: "Orders",
    icon: <FaClipboardList />,
    isDropdown: true,
    children: {
      allOrders: { label: "All Orders", icon: <FaClipboardList /> },
      deliveryOrders: { label: "Delivery Orders", icon: <FaClipboardList /> },
      cancelOrders: { label: "Cancelled Orders", icon: <FaClipboardList /> },
    },
  },
  customers: {
    label: "Users",
    icon: <FaUserFriends />,
    isDropdown: true,
    children: {
      newUsers: { label: "New Users", icon: <FaUserFriends /> },
      oldUsers: { label: "Old Users", icon: <FaUserFriends /> },
    },
  },
  stock: {
    label: "Stock",
    icon: <FaBoxOpen />,
    isDropdown: true,
    children: {
      addStock: { label: "Add Stock", icon: <FaBoxOpen /> },
      stockDetails: { label: "Stock Details", icon: <FaBoxOpen /> },
    },
  },
  billing: { label: "Billing", icon: <FaMoneyBillWave /> },

  getOrders: { label: "GetOrderDetail", icon: <FaClipboardList /> },
  reviews: { label: "Reviews", icon: <FaFileAlt /> },
  dealers: {
    label: "Dealers",
    icon: <FaUserFriends />,
    isDropdown: true,
    children: {
      dealers: { label: "All Dealers", icon: <FaUserFriends /> },
      invoice: { label: "Invoice", icon: <FaFileAlt /> },
    },
  },
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2 rounded w-full transition font-medium cursor-pointer ${
      active ? "bg-white text-blue-900" : "hover:bg-gray-600 text-white"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState({});
  const profileRef = useRef();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [products, setProducts] = useState([]);

  const sidebarRef = useRef(null);
  const lowStockRef = useRef(null);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target) &&
        (!sidebarRef.current || !sidebarRef.current.contains(e.target)) &&
        (!lowStockRef.current || !lowStockRef.current.contains(e.target))
      ) {
        setProfileDropdownOpen(false);
        setOpen(false);
        setShowLowStock(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

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

        return {
          id: doc.id,
          ...order,
          createdAt,
          customerName: order.fullname || "Unknown",
          time: createdAt?.toLocaleTimeString() || "Just now",
        };
      });

      // Filter today's orders with status "Place Order" or "Placed"
      const todayOrders = data.filter(
        (order) =>
          order.createdAt &&
          order.createdAt.toISOString().split("T")[0] === todayStr &&
          ["Place Order", "Placed"].includes(order.status)
      );

      setNotifications(todayOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchStock = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const productList = [];
      const lowStockList = [];

      snapshot.forEach((docSnap) => {
        const product = docSnap.data();
        const stockByVariant = product.stockByVariant || {};
        const variants = [];
        let totalStock = 0;

        Object.entries(stockByVariant).forEach(([key, qty]) => {
          const [color, size] = key.split("-");
          variants.push({ key, color, size, qty });
          totalStock += qty || 0;
        });

        const productData = {
          docId: docSnap.id,
          productId: product.id || docSnap.id,
          name: product.name || "",
          variants,
          totalStock,
        };

        productList.push(productData);

        //  Update to < 5
        if (totalStock < 5) {
          lowStockList.push(productData);
        }
      });

      // Sort by product ID
      productList.sort((a, b) =>
        a.productId.localeCompare(b.productId, undefined, { numeric: true })
      );

      setProducts(productList);
      setLowStockItems(lowStockList);
    } catch (error) {
      toast.error("Failed to fetch stock");
      console.error("Error fetching stock:", error);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const [adminName, setAdminName] = useState("");
  const [adminImage, setAdminImage] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdminName(data.fullName || data.fullname || data.name || "Admin");
          setAdminImage(
            data.photoURL ||
              data.image ||
              "https://randomuser.me/api/portraits/men/75.jpg"
          );
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const [open, setOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;

      case "products":
        return (
          <ProductList
            setSelectedProduct={setSelectedProduct}
            setActiveTab={setActiveTab}
          />
        );

      case "addProduct":
        return (
          <AddProducts
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            setActiveTab={setActiveTab}
          />
        );

      case "allOrders":
        return <AllOrders />;
      case "deliveryOrders":
        return <DeliveryOrders />;
      case "cancelOrders":
        return <CancelOrders />;
      case "billing":
        return <Billing />;
      case "reviews":
        return <Reviews />;
      case "newUsers":
        return <NewUsers />;
      case "oldUsers":
        return <OldUsers />;
      case "addStock":
        return <AddStock />;
      case "category":
        return <Category />;
      case "invoice":
        return <Invoice />;
      case "stockDetails":
        return <StockDetails />;
      case "dealers":
        return <Dealers />;
      case "profile":
        return <Profile />;
      case "getOrders":
        return <GetOrdersDetails />;
      case "ourDesigns":
        return <OurDesings />;

      default:
        return <h2 className="text-red-500">Page not found</h2>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`fixed md:relative z-50 bg-[#192f59] w-64 h-screen text-white transition-transform duration-300 ease-in-out ${
          mobileMenu ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
            <img
              src={logo}
              alt="T-Shirt Logo"
              className="h-16 w-auto object-contain"
            />
            <button
              className="md:hidden text-xl cursor-pointer"
              onClick={() => setMobileMenu(false)}
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2.5">
            {Object.entries(tabLabels).map(([key, value]) => {
              if (value.isDropdown) {
                return (
                  <div key={key}>
                    <div className="cursor-pointer">
                      <SidebarItem
                        icon={value.icon}
                        label={value.label}
                        active={Object.keys(value.children).includes(activeTab)}
                        onClick={() =>
                          setOpenDropdown((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      />
                    </div>
                    {openDropdown[key] && (
                      <div className="ml-6 space-y-1 mt-1">
                        {Object.entries(value.children).map(
                          ([childKey, child]) => (
                            <div key={childKey} className="cursor-pointer">
                              <SidebarItem
                                icon={child.icon}
                                label={child.label}
                                active={activeTab === childKey}
                                onClick={() => {
                                  setActiveTab(childKey);
                                  setMobileMenu(false);
                                }}
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={key} className="cursor-pointer">
                  <SidebarItem
                    icon={value.icon}
                    label={value.label}
                    active={activeTab === key}
                    onClick={() => {
                      setActiveTab(key);
                      setMobileMenu(false);
                    }}
                  />
                </div>
              );
            })}

            {/* Logout */}
            <div className="cursor-pointer">
              <SidebarItem
                icon={<FaSignOutAlt />}
                label="Logout"
                onClick={handleLogout}
              />
            </div>

            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white  hover:bg-gray-800 transition duration-200 shadow-md"
              >
                <FaHome className="text-lg" />
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-0 min-h-screen">
        <header className="bg-[#192f59] text-white flex items-center justify-between px-4 h-auto md:h-20 shadow sticky top-0 z-40 py-3">
          <div className="flex items-center   gap-4 w-full md:w-auto">
            <button
              className="md:hidden text-2xl"
              onClick={() => setMobileMenu(true)}
            >
              <FaBars />
            </button>
            <h1 className="font-bold text-lg whitespace-nowrap">
              {tabLabels[activeTab]?.label || "Admin"}
            </h1>

            <div className="relative hidden md:block">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 rounded-md text-sm text-black bg-white focus:outline-none shadow"
              />
            </div>
          </div>

          {/* Right section */}
          <div
            className="flex items-center gap-4 md:gap-6 ml-auto relative"
            ref={profileRef}
          >
            <div className="relative">
              {/* Low Stock Alert Button */}
              <button
                onClick={() => setShowLowStock((prev) => !prev)}
                className="relative bg-white text-[#192f59] font-bold w-10 h-10 font-serif rounded-full shadow hover:bg-gray-100 text-lg"
                title="Stock Details"
              >
                S
                {lowStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full shadow z-10">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              {/* Low Stock Alert Popup */}
              {showLowStock && (
                <div className="absolute top-13 right-[-120px] w-[300px] sm:w-[400px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 space-y-3">
                  <h1 className="text-lg font-bold text-red-700">
                    Low Stock Alert
                  </h1>

                  {/* Table for Desktop */}
                  <div className="hidden sm:block overflow-auto max-h-72 rounded border">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-black">
                        <tr>
                          <th className="px-4 py-2">Product ID</th>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.length > 0 ? (
                          lowStockItems.map((product) => (
                            <tr
                              key={product.productId}
                              className="border-t bg-gray-50 hover:bg-gray-100"
                            >
                              <td className="px-4 py-2 text-black ">
                                {product.productId}
                              </td>
                              <td className="px-4 py-2 text-black ">
                                {product.name}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-red-600">
                                {product.totalStock}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="text-center py-4 text-gray-500"
                            >
                              No low stock products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Compact Table for Mobile */}
                  <div className="sm:hidden overflow-auto max-h-72 rounded border">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-black">
                        <tr>
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.length > 0 ? (
                          lowStockItems.map((product) => (
                            <tr
                              key={product.productId}
                              className="border-t  hover:bg-gray-100"
                            >
                              <td className="px-3 py-2 text-black">
                                {product.productId}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-red-600">
                                {product.totalStock}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              className="text-center py-4 text-gray-500"
                            >
                              No low stock products.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="relative w-10 h-10 border-2 rounded-full flex items-center justify-center"
              >
                <FaBell className="text-xl" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-[-50px] top-12 w-[90vw] max-w-xs sm:max-w-sm bg-white shadow-xl rounded-lg z-50 overflow-hidden border border-gray-200">
                  <ul className="divide-y max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="p-4 text-gray-500 text-sm text-center">
                        No new orders today
                      </li>
                    ) : (
                      notifications.map((order) => (
                        <li
                          key={order.orderID}
                          onClick={() => {
                            setActiveTab("allOrders");
                            setOpen(false);
                          }}
                          className="flex gap-3 p-4 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center text-gray-600 font-bold">
                            📦
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {order.checkout?.fullname}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              Placed an order - #{order.orderID}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {order.time}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Profile Button */}
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2"
            >
              {/* <img
                src={adminImage}
                alt="profile"
                className="w-10 h-10 rounded-full border-2 p-1.5 object-cover max-w-[120px]"
              /> */}
              <p className="border-2 px-3 py-1 rounded-full text-xl font-bold ">
                {adminName.charAt(0)}
              </p>
              <span className="text-sm hidden md:inline truncate max-w-[120px]">
                {adminName}
              </span>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-2 top-14 w-64 bg-white text-black shadow-md rounded-lg z-50 overflow-hidden">
                <div className="flex items-center px-4 py-3 border-b border-gray-300 gap-3">
                  <div>
                    <p className="font-semibold">{adminName}</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-900 text-gray-800 hover:text-white flex items-center gap-2"
                >
                  <FaUserCircle className="text-gray-600 group-hover:text-white" />
                  My Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 hover:text-red-800 flex items-center gap-2"
                >
                  <FaSignOutAlt className="text-red-600 hover:text-red-800" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50  ">
          {renderContent()}

          <div className="p-0">
            <footer className="bg-[#192f59] text-white text-sm py-4 px-6 text-center shadow-inner">
              © {new Date().getFullYear()} T-Shirt Admin Panel. All rights
              reserved. | Built by YourCompany
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
