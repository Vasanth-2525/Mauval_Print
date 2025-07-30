// src/Components/Navbar.jsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUserCircle,
  FaHeart,
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { MdOutlineManageAccounts, MdAdminPanelSettings } from "react-icons/md";
import { IoIosLogOut } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosArrowDown } from "react-icons/io";
import logo from "/Image/logo.png";
import { AuthContext } from "../Context/AuthContext";
import Login from "./Login";
import RegisterPage from "./Register";
import Search from "./Search";
import CartSidebar from "../Products/CartSidebar";
import Wishlist from "../Products/Wishlist";
import Orders from "../Products/Orders";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Navbar() {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isMobilePagesOpen, setIsMobilePagesOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);

  const { user, logout, cart = [], wishlist = [] } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setAccountDropdownOpen(false);
  };

  useEffect(() => {
    const fetchOrderCount = async () => {
      if (!user?.uid) {
        setOrdersCount(0);
        return;
      }
      try {
        const userOrdersRef = collection(db, "users", user.uid, "orders");
        const snapshot = await getDocs(userOrdersRef);
        setOrdersCount(snapshot.size);
      } catch (err) {
        console.error("Failed to fetch user's order count:", err);
        setOrdersCount(0);
      }
    };
    fetchOrderCount();
  }, [user?.uid, showOrders]);

  const iconBase =
    "h-5 w-5 transition-transform duration-200 hover:-translate-y-0.5";
  const linkBase = "nav-link text-white text-sm md:text-base font-medium";

  const requireLogin = (setter) => {
    if (!user) {
      toast.warn("Login Please");
    } else {
      setter(true);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#283b53] text-white shadow-md py-2 md:py-3 lg:py-1">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 lg:py-2">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-14 w-14 object-contain" />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-6">
          <li className={linkBase}>
            <Link to="/">Home</Link>
          </li>
          <li className={linkBase}>
            <Link to="/products">Products</Link>
          </li>
          <li className={linkBase}>
            <Link to="/designs">Designs</Link>
          </li>
          <li className="relative">
            <button
              onClick={() => setIsPagesOpen(!isPagesOpen)}
              className={` cursor-pointer ${linkBase}`}
            >
              Pages
            </button>
            {isPagesOpen && (
              <ul className="absolute left-0 top-full w-40 bg-white py-2 text-sm text-gray-800 shadow-lg z-50">
                <li>
                  <Link
                    to="/about"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className={linkBase}>
            <Link to="/services">Services</Link>
          </li>
        </ul>

        {/* Always visible icons */}
        <div className="flex items-center gap-4 lg:gap-6 ">
          <button onClick={() => setShowSearch(true)} className=" cursor-pointer">
            <FaSearch className={iconBase} />
          </button>

          <button
            onClick={() => requireLogin(setShowWishlist)}
            className="relative cursor-pointer"
          >
            <FaHeart className={iconBase} />
            {user && wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px]">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => requireLogin(setShowCart)}
            className="relative cursor-pointer"
          >
            <FaShoppingCart className={iconBase} />
            {user && cart.length > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-xs ">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => requireLogin(setShowOrders)}
            className="relative hidden mt-2 lg:block"
          >
            <Orders show={showOrders} onClose={() => setShowOrders(false)} />
            {user && ordersCount > 0 && (
              <span className="absolute -top-1 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-xs">
                {ordersCount}
              </span>
            )}
          </button>

          {/* User icon */}
          <div className="relative ">
            <button
              onClick={() =>
                user
                  ? setAccountDropdownOpen(!accountDropdownOpen)
                  : setShowLogin(true)
              }
              className="h-6 w-6 rounded-full bg-white text-[#283b53] flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              {user?.username?.charAt(0).toUpperCase() || (
                <FaUserCircle className="text-2xl" />
              )}
            </button>
            {user && accountDropdownOpen && (
              <ul className="absolute right-0 mt-2 w-48 bg-white text-gray-800 text-sm py-2 shadow-lg z-50 rounded space-y-1">
                <li>
                  <Link
                    to="/account"
                    onClick={() => setAccountDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                  >
                    <MdOutlineManageAccounts /> Account
                  </Link>
                </li>
                {user.role === "admin" && (
                  <li>
                    <Link
                      to="/admin"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                    >
                      <MdAdminPanelSettings /> Admin Panel
                    </Link>
                  </li>
                )}
                <li className="lg:hidden ml-4 flex items-center cursor-pointer text-black hover:bg-gray-100 py-2">
                  <Orders
                    titleorder={"My Orders"}
                    show={showOrders}
                    onClose={() => setShowOrders(false)}
                  />
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100  cursor-pointer"
                  >
                    <IoIosLogOut /> Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Mobile menu icon */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-md"
        >
          {isOpen ? (
            <FaTimes className="h-6 w-6" />
          ) : (
            <FaBars className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* SEARCH BAR */}
      {showSearch && (
        <div className="absolute left-1/2 top-full z-40 w-full -translate-x-1/2 bg-primary px-4 py-3 shadow-md lg:max-w-xl">
          <div className="relative w-full">
            <Search
              placeholder="Search for products..."
              onSelect={(product) => {
                setShowSearch(false);
                navigate(`/productdetails/${product.productId}`);
              }}
            />
            <button
              onClick={() => setShowSearch(false)}
              className="absolute top-0 right-2 text-primary text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu (Pages Only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0 }}
            animate={{ height: "100vh" }}
            exit={{ height: 0 }}
            className="overflow-y-auto bg-[#283b53] text-white shadow-inner lg:hidden"
          >
            <ul className="flex flex-col gap-4 px-6 py-4">
              <li>
                <Link to="/" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" onClick={() => setIsOpen(false)}>
                  Products
                </Link>
              </li>
              <li>
                <Link to="/designs" onClick={() => setIsOpen(false)}>
                  Designs
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setIsMobilePagesOpen(!isMobilePagesOpen)}
                  className="flex justify-between w-full"
                >
                  Pages{" "}
                  <IoIosArrowDown
                    className={`transition ${
                      isMobilePagesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isMobilePagesOpen && (
                  <ul className="ml-4 mt-2 flex flex-col gap-2">
                    <li>
                      <Link to="/about" onClick={() => setIsOpen(false)}>
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact" onClick={() => setIsOpen(false)}>
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li>
                <Link to="/services" onClick={() => setIsOpen(false)}>
                  Services
                </Link>
              </li>
            </ul>

            <div className="flex flex-col pl-5 justify-between">
              <h3 className="text-lg uppercase font-semibold mb-2">Contact</h3>
              <ul className="text-gray-300 text-md space-y-3">
                <li className="flex items-center gap-2">
                  <FaPhoneAlt /> <span>+91 6385381388</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaEnvelope /> <span>mauvalprint@gmail.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-1" />
                  <span>
                    No.347,Saibaba colony,
                    <br />
                    Asiriyar Nagar, Tirupattur - 635601
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex gap-4 pl-5 mt-6">
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaFacebookF />
              </a>
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaInstagram />
              </a>
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaTwitter />
              </a>
              <a href="#" className="text-gray-300 text-xl hover:text-white">
                <FaLinkedinIn />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitch={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      {showRegister && (
        <RegisterPage
          onClose={() => setShowRegister(false)}
          onSwitch={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      <CartSidebar show={showCart} onClose={() => setShowCart(false)} />
      <Wishlist show={showWishlist} onClose={() => setShowWishlist(false)} />
    </header>
  );
}
