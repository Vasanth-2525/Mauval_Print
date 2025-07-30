import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link } from "react-router-dom";
import { FaStar, FaHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";

function Product() {
  const { products, addToCart, addToWishlist } = useContext(AuthContext);
  const [clickedProductId, setClickedProductId] = useState(null);
  const [cardSize, setCardSize] = useState({});

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);
  const toggleBubble = (productId) => {
    setClickedProductId((prevId) => (prevId === productId ? null : productId));
  };

  return (
    <section className="p-6 md:p-10 bg-white">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
        Our Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.isArray(products) &&
          products.slice(0, 10).map((product, index) => (
            <div
              key={product.id || index}
              onClick={() => toggleBubble(product.id)}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative bg-white border text-center border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 p-4"
            >
              {/* ─────── Image with Bubble Effects ─────── */}
              <div className="relative w-full h-52 bg-primary/5 rounded-[30px] overflow-hidden shadow-lg transition-transform duration-1000 ease-in-out hover:scale-105 group">
                {/* Bubble 1 (Cart) */}
                <div
                  className={`absolute w-[70%] h-[70%] transition-all duration-400 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${
                    clickedProductId === product.id
                      ? "bottom-0 left-0"
                      : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
                  }`}
                  style={{
                    borderTop: "2px solid white",
                    borderRight: "1px solid white",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => {
                        const selectedSize = cardSize[product.id];
                        const defaultColor = product?.color?.[0];

                        if (!selectedSize) {
                          return toast.warn("Please select a size");
                        }

                        if (!defaultColor) {
                          return toast.warn(
                            "No color available for this product"
                          );
                        }
                        addToCart({
                          ...product,
                          selectedSize,
                          selectedColor: defaultColor,
                        });

                        // toast.success("Added to cart!");
                      }}
                      className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
                      title="Add to Cart"
                    >
                      <FaShoppingCart size={16} />
                    </button>
                  </div>
                </div>

                {/* Bubble 2 (Wishlist) */}
                <div
                  className={`absolute w-[50%] h-[50%] transition-all duration-700 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${
                    clickedProductId === product.id
                      ? "bottom-0 left-0"
                      : "bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
                  }`}
                  style={{
                    borderTop: "2px solid white",
                    borderRight: "1px solid white",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => addToWishlist(product)}
                      className="text-white bg-white/20 p-2 cursor-pointer rounded-full hover:bg-white hover:text-primary transition"
                      title="Add to Wishlist"
                    >
                      <FaHeart size={16} />
                    </button>
                  </div>
                </div>

                {/* Bubble 3 (View Details) */}
                <div
                  className={`absolute w-[32%] h-[32%] transition-all duration-1000 ease-in-out z-10 rounded-[10%_13%_42%_0%/10%_12%_75%_0%] bg-primary/30 ${
                    clickedProductId === product.id
                      ? "bottom-0 left-0"
                      : " bottom-[-70%] left-[-70%] group-hover:bottom-0 group-hover:left-0"
                  }`}
                  style={{
                    borderTop: "2px solid white",
                    borderRight: "1px solid white",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div className="absolute top-2 right-2">
                    <Link to={`/productdetails/${product.productId}`}>
                      <button
                        className="text-white bg-white/20 p-2 rounded-full cursor-pointer hover:bg-white hover:text-primary transition"
                        title="View Details"
                      >
                        <FaEye size={16} />
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Product Image */}
                <img
                  src={
                    product?.images?.[0] ||
                    product?.image?.[0] ||
                    "/placeholder.jpg"
                  }
                  alt={product.name}
                  className="relative z-5 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* ─────── Product Info ─────── */}
              <h3 className="text-lg font-semibold text-gray-800 truncate mt-3">
                {product.name}
              </h3>

              <div className="flex items-center justify-center text-yellow-500 text-sm my-1 gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={
                      i < Math.round(product?.rating || 0)
                        ? ""
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <p className="text-md font-bold text-primary mt-2">
                MRP: <del>₹{product?.mrp || 0}</del> ₹{product?.salePrice || 0}
              </p>

              <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center justify-center gap-1 ">
                {(product?.size || []).map((sz) => {
                  const selectedColor = product.color?.[0]; // default to first color
                  const variantKey = `${selectedColor}-${sz}`;
                  const isAvailable = product.stockByVariant?.[variantKey] > 0;

                  return (
                    <button
                      key={sz}
                      onClick={() =>
                        isAvailable &&
                        setCardSize((prev) => ({ ...prev, [product.id]: sz }))
                      }
                      className={`px-2 py-0.5 rounded-full text-xs border  ${
                        cardSize[product.id] === sz
                          ? "bg-primary text-white border-primary"
                          : isAvailable
                          ? "bg-white text-gray-700 border-gray-300 cursor-pointer"
                          : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                      }`}
                      disabled={!isAvailable}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

export default Product;
