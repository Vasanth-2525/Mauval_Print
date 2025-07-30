import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoMdHeartEmpty, IoMdHeart } from "react-icons/io";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { AuthContext } from "../Context/AuthContext";
import Head from "../Components/Head";
import Review from "./Review";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sizechart from "/Image/size.webp";
import ZoomImage from "./ZoomImage";
import Login from "../Components/Login";
import RegisterPage from "../Components/Register";

const SingleProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewImageRef = useRef();

  const {
    products,
    addToCart,
    addToWishlist,
    wishlist = [],
    user,
  } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [showSize, setShowSize] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);

  const [overlayImage, setOverlayImage] = useState(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 });
  const [overlaySize, setOverlaySize] = useState(100);
  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textPosition, setTextPosition] = useState({ x: 10, y: 10 });
  const [textSize, setTextSize] = useState(24);

  useEffect(() => {
    const found = products.find((p) => `${p.productId || p.id}` === id);
    if (found) {
      setProduct(found);
      const sizes = new Set();
      const colors = new Set();

      for (const key in found.stockByVariant || {}) {
        if (found.stockByVariant[key] > 0) {
          const [color, size] = key.split("-");
          sizes.add(size);
          colors.add(color);
        }
      }

      const sizeArray = Array.from(sizes);
      const colorArray = Array.from(colors);

      setSelectedSize(sizeArray[0] || "");
      setSelectedColor(colorArray[0] || "");
      setAvailableSizes(sizeArray);
      setAvailableColors(colorArray);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, products]);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor)
      return toast.warn("Please select size and color");
    addToCart({ ...product, selectedSize, selectedColor }, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor)
      return alert("Please select size and color");
    const finalPrice = product.salePrice;
    const originalPrice = product.mrp;
    const discount = Math.round(
      ((originalPrice - finalPrice) / originalPrice) * 100
    );

    const productToBuy = {
      id: product.id || product.productId,
      name: product.name,
      price: finalPrice,
      originalPrice,
      discount,
      image: product.images[selectedImageIndex],
      size: selectedSize,
      color: selectedColor,
      quantity,
    };

    navigate("/checkout", {
      state: { buyNowProduct: productToBuy, fromCart: false },
    });
  };

  const handleOverlayMove = (e) => {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const parent = e.target.parentElement.getBoundingClientRect();
    setOverlayPosition({
      x: clientX - parent.left - overlaySize / 2,
      y: clientY - parent.top - overlaySize / 2,
    });
  };
  const handleOverlayTouchStart = () => setIsDraggingOverlay(true);
  const handleOverlayTouchEnd = () => setIsDraggingOverlay(false);

  const handleOverlayTouchMove = (e) => {
    if (!isDraggingOverlay) return;
    const touch = e.touches[0];
    const parent = e.target.parentElement.getBoundingClientRect();
    setOverlayPosition({
      x: touch.clientX - parent.left - overlaySize / 2,
      y: touch.clientY - parent.top - overlaySize / 2,
    });
  };

  const handleTextMove = (e) => {
    const isTouch = e.type.startsWith("touch");
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const parent = e.target.parentElement.getBoundingClientRect();
    setTextPosition({
      x: clientX - parent.left - 20,
      y: clientY - parent.top - 10,
    });
  };
  const handleTextTouchStart = () => setIsDraggingText(true);
  const handleTextTouchEnd = () => setIsDraggingText(false);

  const handleTextTouchMove = (e) => {
    if (!isDraggingText) return;
    const touch = e.touches[0];
    const parent = e.target.parentElement.getBoundingClientRect();
    setTextPosition({
      x: touch.clientX - parent.left - 20,
      y: touch.clientY - parent.top - 10,
    });
  };

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const preview = previewImageRef.current;
    const previewBox = preview.parentElement;
    canvas.width = previewBox.offsetWidth;
    canvas.height = previewBox.offsetHeight;
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    const drawFinal = () => {
      if (text) {
        ctx.fillStyle = textColor;
        ctx.font = `${textSize}px Arial`;
        ctx.fillText(text, textPosition.x, textPosition.y + textSize);
      }
      const link = document.createElement("a");
      link.download = "customized-product.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    if (overlayImage) {
      const overlay = new Image();
      overlay.crossOrigin = "anonymous";
      overlay.src = overlayImage;
      overlay.onload = () => {
        ctx.drawImage(
          overlay,
          overlayPosition.x,
          overlayPosition.y,
          overlaySize,
          overlaySize
        );
        drawFinal();
      };
    } else {
      drawFinal();
    }
  };

  const handlePlaceCustomizedOrder = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const preview = previewImageRef.current;
    const previewBox = preview.parentElement;
    canvas.width = previewBox.offsetWidth;
    canvas.height = previewBox.offsetHeight;
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    const drawAndNavigate = () => {
      if (text) {
        ctx.fillStyle = textColor;
        ctx.font = `${textSize}px Arial`;
        ctx.fillText(text, textPosition.x, textPosition.y + textSize);
      }

      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const customizedImage = reader.result;
            const finalPrice = product.salePrice;
            const originalPrice = product.mrp;
            const discount = Math.round(
              ((originalPrice - finalPrice) / originalPrice) * 100
            );

            const customizedProduct = {
              id: product.id || product.productId,
              name: product.name,
              price: finalPrice,
              originalPrice,
              discount,
              customizedImage,
              size: selectedSize,
              color: selectedColor,
              quantity,
              isCustomized: true,
            };

            navigate("/checkout", {
              state: { buyNowProduct: customizedProduct, fromCart: false },
            });
          };
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.7
      );
    };

    if (overlayImage) {
      const overlay = new Image();
      overlay.crossOrigin = "anonymous";
      overlay.src = overlayImage;
      overlay.onload = () => {
        ctx.drawImage(
          overlay,
          overlayPosition.x,
          overlayPosition.y,
          overlaySize,
          overlaySize
        );
        drawAndNavigate();
      };
    } else {
      drawAndNavigate();
    }
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => {
      if (rating >= i + 1)
        return <FaStar key={i} className="text-yellow-500" />;
      else if (rating >= i + 0.5)
        return <FaStarHalfAlt key={i} className="text-yellow-500" />;
      else return <FaRegStar key={i} className="text-yellow-500" />;
    });

  if (!product) return <div className="p-6 text-center">Loading...</div>;
  const isWishlisted = wishlist.some((p) => p.id === product.id);

  return (
    <div className="mt-20">
      <Head title={product.name} subtitle={product.name} />

      <div className="px-4 md:px-20">
        <div className="grid lg:grid-cols-2 gap-10 border-b border-primary py-10">
          <div className="z-10">
            {/* ✅ Zoom Image Component */}
            <ZoomImage
              imageSrc={product.images[selectedImageIndex]}
              thumbnails={product.images}
              selectedImageIndex={selectedImageIndex}
              onImageSelect={setSelectedImageIndex}
            />
          </div>
          {/* Info */}
          <div className="space-y-5 relative mt-5">
            <h2 className="text-3xl font-bold text-gray-900">{product.name}</h2>

            <div className="flex items-center gap-2">
              {renderStars(product.rating || 0)}
              <span className="text-gray-500 text-sm">
                ({product.reviews?.length || 0} Reviews)
              </span>
            </div>

            <div className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              ₹{product.salePrice.toFixed(2)}
              {product.mrp && (
                <>
                  <span className="text-gray-400 line-through text-base font-normal">
                    ₹{product.mrp}
                  </span>
                  <span className="text-green-600 text-sm font-medium">
                    (
                    {Math.round(
                      ((product.mrp - product.salePrice) / product.mrp) * 100
                    )}
                    % OFF)
                  </span>
                </>
              )}
            </div>

            {/* Sizes */}
            <div>
              <p className="font-semibold text-gray-700 mb-1">Sizes:</p>
              <div className="flex items-end gap-5">
                <div className="flex gap-2 flex-wrap">
                  {availableSizes.map((s) => {
                    const variantKey = `${selectedColor}-${s}`;
                    const stock =
                      product?.stockByVariant &&
                      product.stockByVariant[variantKey];

                    const isAvailable = stock > 0;

                    return (
                      <button
                        key={s}
                        onClick={() => isAvailable && setSelectedSize(s)}
                        className={`border px-4 py-1 rounded ${
                          selectedSize === s
                            ? "bg-black text-white cursor-pointer"
                            : isAvailable
                            ? "bg-white text-black cursor-pointer"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!isAvailable}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <p
                  className="text-sm text-primary underline cursor-pointer mt-1"
                  onClick={() => setShowSize(!showSize)}
                >
                  View Size Chart
                </p>
                {showSize && (
                  <div className=" hidden md:block absolute -right-1/3 top-20 bottom-1/2">
                    <img
                      src={Sizechart}
                      alt="Size Chart"
                      className="w-1/2 z-20"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Colors */}
            <div>
              <p className="font-semibold text-gray-700 mb-1 mt-4">Colors:</p>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => (
                  <div
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                      selectedColor === color
                        ? "border-black scale-110"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 border rounded text-lg cursor-pointer"
              >
                -
              </button>
              <span className="text-lg font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 border rounded text-lg cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAddToCart}
                className="border px-6 py-3 rounded text-black hover:bg-gray-100 cursor-pointer"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 cursor-pointer"
              >
                Buy Now
              </button>
              <button
                onClick={() => {
                  user ? setShowPopup(true) : setShowLogin(true);
                }}
                className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition cursor-pointer"
              >
                Customize
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addToWishlist(product)}
                className="border px-6 py-3 rounded flex items-center gap-2 text-black cursor-pointer"
              >
                {isWishlisted ? (
                  <IoMdHeart className="text-red-500" />
                ) : (
                  <IoMdHeartEmpty />
                )}
                Add to Favorites
              </button>
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="border px-6 py-3 rounded text-black cursor-pointer"
              >
                View Description +
              </button>
            </div>
            {showDescription && (
              <>
                <span className="font-bold">Description:</span>
                <p className="ml-5">{product.description}</p>
              </>
            )}
          </div>
        </div>

        <Review
          reviews={product.reviews || []}
          uname={user?.username || user?.email}
          productname={product.name}
          productId={product.productId}
        />

        {showPopup && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-4 overflow-y-auto py-8">
            <div className="bg-white p-6 rounded-md max-w-5xl w-full relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-2 right-2 cursor-pointer"
              >
                <IoClose size={20} />
              </button>
              <h2 className="text-xl font-semibold mb-4 text-center">
                Product Customization
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative border bg-gray-50 rounded-lg p-4 h-[66vh] flex flex-col justify-between">
                  {/* Preview Image */}
                  <div className="relative flex-1 flex justify-center items-center overflow-hidden">
                    <img
                      ref={previewImageRef}
                      src={product.images[selectedImageIndex]}
                      alt="preview"
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Overlay Image */}
                    {overlayImage && (
                      <img
                        src={overlayImage}
                        draggable
                        onDragEnd={handleOverlayMove}
                        onTouchStart={handleOverlayTouchStart}
                        onTouchMove={handleOverlayTouchMove}
                        onTouchEnd={handleOverlayTouchEnd}
                        className="absolute object-contain cursor-move touch-none"
                        style={{
                          width: overlaySize,
                          height: overlaySize,
                          top: overlayPosition.y,
                          left: overlayPosition.x,
                        }}
                      />
                    )}

                    {/* Overlay Text */}
                    {text && (
                      <span
                        draggable
                        onDragEnd={handleTextMove}
                        onTouchStart={handleTextTouchStart}
                        onTouchMove={handleTextTouchMove}
                        onTouchEnd={handleTextTouchEnd}
                        className="absolute font-bold cursor-move touch-none break-words text-center"
                        style={{
                          color: textColor,
                          fontSize: `${textSize}px`,
                          top: textPosition.y,
                          left: textPosition.x,
                        }}
                      >
                        {text}
                      </span>
                    )}
                  </div>

                  {/* Thumbnails */}
                  <div className="mt-4 overflow-x-auto">
                    <div className="flex gap-2 justify-center ">
                      {product.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`thumb-${idx}`}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-16 h-16 border p-1 rounded-lg cursor-pointer object-contain transition-all duration-200 ${
                            selectedImageIndex === idx
                              ? "border-blue-500"
                              : "border-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Upload Image Overlay
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setOverlayImage(URL.createObjectURL(e.target.files[0]))
                    }
                    className="border w-full p-2 rounded cursor-pointer"
                  />

                  <label className="block text-sm font-medium">
                    Resize Image
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={overlaySize}
                    onChange={(e) => setOverlaySize(+e.target.value)}
                    class="w-full h-1 bg-primary rounded-lg appearance-none slider-thumb"
                  />

                  <label className="block text-sm font-medium">Add Text</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Your text"
                    className="border w-full p-2 rounded"
                  />

                  <label className="block text-sm font-medium">Text Size</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={textSize}
                    onChange={(e) => setTextSize(+e.target.value)}
                    class="w-full h-1 bg-primary rounded-lg appearance-none slider-thumb"
                  />

                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm">{textColor}</span>
                  </div>

                  <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center gap-3 pt-4 w-full">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="px-4 py-2 w-full md:w-auto border border-gray-400 text-gray-700 rounded-md hover:bg-gray-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 w-full md:w-auto bg-primary/90 text-white rounded-md hover:bg-primary transition shadow cursor-pointer"
                    >
                      Download Only
                    </button>
                    <button
                      onClick={handlePlaceCustomizedOrder}
                      className="px-4 py-2 w-full md:w-auto bg-orange-600 text-white rounded-md hover:bg-orange-700 transition shadow cursor-pointer"
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
    </div>
  );
};

export default SingleProductView;
