import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { AuthContext } from "../Context/AuthContext";
import Head from "../Components/Head";
import Review from "./Review";
import { toast } from "react-toastify";

const DesignDetails = () => {
  const { productId } = useParams();
  const { user, designs, addToCart } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedSize, setSelectedSize] = useState("S");
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const design = designs?.find((d) => d.productId === productId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Design not found</p>
      </div>
    );
  }

  const {
    name,
    rating,
    description,
    images = [],
    reviews = [],
    price = 837,
    discount = 15,
    size,
  } = design;

  const finalPrice = price - (price * discount) / 100;

  const handleAddToCart = () => {
    if (!selectedSize) return toast.warn("Please select a size");
    const item = {
      ...design,
      id: design.productId,
      selectedSize,
      quantity,
      price: finalPrice,
      image: images[selectedImageIndex],
    };
    addToCart(item, quantity);
  };

  const handleBuyNow = () => {
    const productToBuy = {
      productId,
      name,
      price: finalPrice,
      originalPrice: price,
      discount,
      image: images[selectedImageIndex],
      size: selectedSize,
      quantity,
    };

    navigate("/checkout", {
      state: {
        buyNowProduct: productToBuy,
        fromCart: false,
      },
    });
  };

  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++)
      stars.push(<FaStar key={i} className="text-yellow-500" />);
    if (hasHalfStar)
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
    for (let i = stars.length; i < 5; i++)
      stars.push(<FaRegStar key={i + "empty"} className="text-yellow-500" />);
    return stars;
  };

  return (
    <div className="mt-18">
      <Head title="Design Details" subtitle={name} />

      <div className="bg-white py-6 px-4 sm:px-8 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-10 mt-8">
          {/* Image Section with Zoom */}
          <div className="flex flex-col items-center">
            <div
              className="relative rounded-lg shadow p-6 w-full h-[500px] flex flex-col"
              onMouseLeave={() => setZoomVisible(false)}
            >
              {/* Main Zoomable Image */}
              <div
                className="relative w-full h-full overflow-hidden "
                onMouseMove={(e) => {
                  const container = e.currentTarget;
                  const rect = container.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomVisible(true);
                  setZoomPosition({ x, y });
                }}
              >
                <img
                  src={images[selectedImageIndex]}
                  alt={name}
                  className="w-full h-full object-contain hover:cursor-crosshair"
                />
              </div>
              {/* Thumbnails */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index}`}
                  className={`w-16 h-16 object-cover border rounded cursor-pointer ${
                    selectedImageIndex === index
                      ? "border-primary ring-2 ring-primary"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                />
              ))}
            </div>

              {/* Zoomed Image Preview */}
              {zoomVisible && (
                <div className=" absolute left-full top-0 w-100 h-full  bg-white">
                  <div
                    className="w-full h-full bg-no-repeat bg-contain rounded-lg"
                    style={{
                      backgroundImage: `url(${images[selectedImageIndex]})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: "200%",
                    }}
                  ></div>
                </div>
              )}
            </div>

            
          </div>
          {/* Details Section */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{name}</h2>
            <div className="mt-2 flex items-center gap-2">
              {renderStars(rating)}
              <span className="text-gray-600 text-sm">
                ({reviews.length} Reviews)
              </span>
            </div>

            <div className="mt-4 text-xl font-semibold text-gray-800">
              ₹{finalPrice.toFixed(2)}{" "}
              <span className="line-through text-gray-500 text-sm ml-2">
                ₹{price}
              </span>{" "}
              <span className="text-green-600 font-medium text-sm ml-2">
                ({discount}% OFF)
              </span>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <div>
              <p className="font-medium mb-2">Sizes:</p>
              <div className="flex gap-3">
                {size.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeClick(size)}
                    className={`px-3 py-1 border rounded ${
                      selectedSize === size
                        ? "bg-gray-800 text-white cursor-pointer"
                        : "bg-white border-gray-400 cursor-pointer"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              </div>
              <p className="mt-2 underline text-sm cursor-pointer">
                View Size Chart
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex border rounded overflow-hidden">
                <button
                  className="px-3 py-1 text-lg font-bold bg-white cursor-pointer"
                  onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                >
                  -
                </button>
                <span className="px-4 py-1 bg-white text-lg">{quantity}</span>
                <button
                  className="px-3 py-1 text-lg font-bold bg-white cursor-pointer"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto bg-white border border-gray-900 text-gray-900 font-semibold px-6 py-2 rounded cursor-pointer"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full sm:w-auto bg-gray-900 text-white font-semibold px-6 py-2 rounded cursor-pointer"
              >
                Buy Now
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button className="w-full sm:w-auto bg-gray-900 text-white font-semibold px-6 py-2 rounded cursor-pointer">
                ♡ Add to Favorites
              </button>
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="w-full sm:w-auto border border-gray-900 text-gray-900 font-semibold px-6 py-2 rounded cursor-pointer"
              >
                {showDescription ? "Hide Description -" : "View Description +"}
              </button>
            </div>

            {showDescription && (
              <p className="mt-6 text-gray-700 leading-relaxed">
                {description || "No description available."}
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12 border-t pt-10">
          <Review
            reviews={reviews}
            uname={user?.username || user?.email}
            productname={name}
            productId={productId}
          />
        </div>
      </div>
    </div>
  );
};

export default DesignDetails;
