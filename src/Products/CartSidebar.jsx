import React, { useContext } from "react";
import { FaPlus, FaMinus, FaTimes, FaShoppingCart } from "react-icons/fa";
import { BsFillTrashFill } from "react-icons/bs";
import { AuthContext } from "../Context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const CartSidebar = ({ show, onClose }) => {
  const { cart, updateQuantity, removeFromCart } = useContext(AuthContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 20 : 0;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    onClose();
    navigate("/checkout", {
      state: {
        cartWithSubtotal: cart.map((item) => ({
          ...item,
          subtotal: item.price * item.quantity,
        })),
        total: total.toFixed(2),
        shipping: {
          shippingFee: shipping,
          tax: tax.toFixed(2),
          subtotal: subtotal.toFixed(2),
        },
      },
    });
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[100%] max-w-sm bg-white shadow-lg z-50 transform transition-transform duration-300 flex flex-col ${
        show ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-800">Cart</h2>
        <button
          onClick={onClose}
          className="text-primary hover:text-primary/90 cursor-pointer"
        >
          <FaTimes size={18} />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-16 text-gray-600">
            <FaShoppingCart size={60} className="text-[#283b53] mb-4" />
            <h3 className="text-lg font-semibold">Your cart is empty</h3>
            <p className="text-sm mt-1">
              Looks like you haven’t added anything to your cart yet.
            </p>
            <Link
              to="/products"
              onClick={onClose}
              className="mt-6 inline-block px-5 py-2 bg-[#283b53] text-white rounded-md hover:bg-[#1e2e40] transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={`${item.id}-${item.selectedSize}-${
                item.selectedColor || ""
              }`}
              className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-4"
            >
              <img
                src={item.image?.[0] || item.images?.[0]}
                alt={item.name}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain border rounded-md shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-md text-gray-800 truncate">
                  {item.name}
                </h3>
                <p className="text-gray-500 text-sm font-semibold">
                  MRP: ₹{item.price}
                </p>
                <p className="text-gray-500 text-sm">
                  Size: {item.selectedSize}
                </p>
                <p className="font-bold text-sm sm:text-md text-primary">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.selectedSize,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 text-primary cursor-pointer"
                  >
                    <FaMinus size={9} />
                  </button>
                  <span className="mx-1 text-sm font-medium text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.selectedSize,
                        item.quantity + 1
                      )
                    }
                    className="p-1 rounded-full bg-indigo-100 hover:bg-indigo-200 text-primary cursor-pointer"
                  >
                    <FaPlus size={9} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id, item.selectedSize)}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                  title="Remove Item"
                >
                  <BsFillTrashFill />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Summary */}
      {cart.length > 0 && (
        <div className="p-4 border-t bg-white">
          <div className="flex justify-between text-base mb-2 text-gray-800">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base mb-2 text-gray-800">
            <span>Shipping</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base mb-2 text-gray-800">
            <span>Tax (15%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-gray-300" />
          <div className="flex justify-between font-bold text-xl text-black mb-4">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button
            className="w-full bg-[#1e293b] text-white py-2 rounded-md font-semibold hover:bg-[#0f172a] transition cursor-pointer"
            onClick={handleCheckout}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
