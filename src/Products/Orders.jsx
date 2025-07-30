import React, { useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../Context/AuthContext";
import { ImSpinner8 } from "react-icons/im";
import { FaTrashAlt, FaBoxOpen, FaPrint } from "react-icons/fa";
import { db } from "../firebase";
import {
  onSnapshot,
  collection,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";

const Orders = ({ titleorder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: "" });

  const { user } = useContext(AuthContext);
  const printRef = useRef();

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const fetched = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((order) => order.userId === user.uid);
        const sorted = fetched.sort(
          (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
        );
        setOrders(sorted);
        setLoading(false);
      },
      () => toast.error("Error fetching orders")
    );

    return () => unsubscribe();
  }, [user]);

  const toggleDrawer = () => setIsOpen(!isOpen);

  const handleDelete = async (e, orderId) => {
    e.stopPropagation();
    if (!orderId) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      toast.success("Order deleted!");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const trackingSteps = [
    "Place Order",
    "Paked",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  const getTrackingIndex = (status) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized.includes("cancel")) return 4;
    if (normalized.includes("delivered")) return 3;
    if (normalized.includes("shipped")) return 2;
    if (normalized.includes("paked")) return 1;
    if (normalized.includes("place")) return 0;
    return 0;
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "", "width=800,height=600");
    win.document.write(`
      <html>
        <head>
          <title>Print Order</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 14px; }
            th { background-color: #f5f5f5; }
            img { width: 40px; height: 40px; object-fit: cover; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const openCancelModal = () => {
    setReason("");
    setShowCancelModal(true);
  };

  const submitCancelRequest = async () => {
    if (!reason.trim()) return toast.warn("Please enter a reason.");
    setIsCancelling(true);
    try {
      await addDoc(collection(db, "cancelOrders"), {
        ...selectedOrder,
        reason,
        cancelledAt: new Date(),
      });

      // Update status in orders collection
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        status: "Cancelled",
      });

      toast.success("Order cancelled.");
      setShowCancelModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };
  const openReviewModal = () => {
    setReviewData({ rating: 0, comment: "" });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim() || reviewData.rating === 0) {
      toast.warn("Please provide a comment and rating.");
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        name: selectedOrder.checkout?.fullname,
        product: selectedOrder.cart?.[0]?.name || "Unknown Product",
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toISOString().split("T")[0],
        featured: false,
      });

      toast.success("Review submitted!");
      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review.");
    }
  };

  return (
    <div className="text-black text-left">
      <button
        onClick={toggleDrawer}
        className="flex gap-2 items-center lg:text-2xl  lg:text-white text-black cursor-pointer"
      >
        <FaBoxOpen />
        {titleorder}
      </button>

      {isOpen && (
        <div className="fixed top-0 right-0 w-full sm:w-[500px] h-full bg-white z-50 shadow-lg overflow-y-auto">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-bold text-slate-800">Order History</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-2xl font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="flex justify-center h-full">
                <ImSpinner8 className="animate-spin text-3xl text-slate-700 " />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">
                No orders found.
              </p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="border rounded-lg shadow-sm p-4 cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div className="text-xl font-bold">
                      OrderId: {order.orderID}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, order.id)}
                      className="text-red-500 cursor-pointer"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                  <p className="text-sm">
                    <strong>Name:</strong> {order.checkout?.fullname}
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong> {order.checkout?.contact}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <strong>Status:</strong>
                    <span
                      className={`px-2 py-1 rounded text-white text-xs font-medium ${
                        order.status?.toLowerCase().includes("cancel")
                          ? "bg-red-600"
                          : order.status?.toLowerCase().includes("delivered")
                          ? "bg-green-600"
                          : order.status?.toLowerCase().includes("shipped")
                          ? "bg-orange-500"
                          : order.status?.toLowerCase().includes("paked")
                          ? "bg-yellow-500 text-black"
                          : "bg-gray-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>

                  <p className="text-sm">
                    <strong>Date:</strong> {formatDate(order.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center">
          <div
            ref={printRef}
            className="bg-white p-6 rounded-lg max-w-2xl w-full relative overflow-y-auto max-h-[90vh]"
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-2 right-4 text-2xl font-bold cursor-pointer"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-2">
              Order #{selectedOrder.orderID}
            </h2>
            <p className="text-sm mb-2">
              <strong>Name:</strong> {selectedOrder.checkout?.fullname}
              <br />
              <strong>Address:</strong> {selectedOrder.checkout?.street},{" "}
              {selectedOrder.checkout?.city}, {selectedOrder.checkout?.state},{" "}
              {selectedOrder.checkout?.zip}, {selectedOrder.checkout?.country}
              <br />
              <strong>Phone:</strong> {selectedOrder.checkout?.contact}
              <br />
              <strong>Email:</strong> {selectedOrder.checkout?.email}
              <br />
              <strong>Payment ID:</strong> {selectedOrder.paymentID}
              <br />
              <strong>Status:</strong> {selectedOrder.status}
              <br />
              <strong>Ordered On:</strong> {formatDate(selectedOrder.createdAt)}
            </p>

            <h3 className="font-bold mt-4 mb-2">Product(s):</h3>
            {selectedOrder.cart?.map((item, i) => (
              <div
                key={i}
                className="relative flex gap-4 mb-4 border p-2 rounded"
              >
                <img
                  src={item.image || item.customizedImage}
                  className="w-16 h-16 object-cover"
                />
                <div className="text-sm">
                  <p>
                    <strong>{item.name}</strong>
                  </p>
                  <p>Size: {item.size}</p>
                  <p>Qty: {item.quantity}</p>
                  <p>Price: ₹{item.price}</p>
                  <p>Subtotal: ₹{item.subtotal}</p>
                </div>
                <button
                  onClick={handlePrint}
                  className="absolute top-5 right-5 text-sm bg-slate-800 text-white px-3 py-1 rounded cursor-pointer"
                >
                  <FaPrint className="inline-block mr-2 "  /> Print
                </button>
              </div>
            ))}

            <div className="flex justify-between items-center mt-4">
              <h3 className="font-bold">Tracking:</h3>
              {selectedOrder.status?.toLowerCase() !== "delivered" &&
                !selectedOrder.status?.toLowerCase().includes("cancel") && (
                  <button
                    onClick={openCancelModal}
                    className="text-sm bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              {selectedOrder?.status?.toLowerCase() === "delivered" &&
                !showReviewModal && (
                  <button
                    onClick={openReviewModal}
                    className="px-2 py-1 rounded text-sm bg-primary  text-white  cursor-pointer"
                  >
                    Leave a Review
                  </button>
                )}
            </div>

            <div className="flex justify-between items-center mb-2 mt-3">
              {trackingSteps.map((step, i) => {
                const isCancelled = selectedOrder.status
                  ?.toLowerCase()
                  .includes("cancel");
                const reachedStep = i <= getTrackingIndex(selectedOrder.status);
                const circleColor = isCancelled
                  ? reachedStep
                    ? "bg-red-600"
                    : "bg-gray-300"
                  : reachedStep
                  ? "bg-green-600"
                  : "bg-gray-300";
                const barColor = isCancelled
                  ? i < getTrackingIndex(selectedOrder.status)
                    ? "bg-red-600"
                    : "bg-gray-300"
                  : i < getTrackingIndex(selectedOrder.status)
                  ? "bg-green-600"
                  : "bg-gray-300";

                return (
                  <div key={i} className="flex-1 text-center relative">
                    <div
                      className={`w-6 h-6 rounded-full mx-auto mb-1 z-10 relative ${circleColor}`}
                    />
                    {i < trackingSteps.length - 1 && (
                      <div
                        className={`absolute top-3 left-full h-1 w-full transform -translate-x-1/2 z-0 ${barColor}`}
                      />
                    )}
                    <p className="text-xs mt-2">{step}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-2">Cancel Order</h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border p-2 rounded mb-4"
                  rows={4}
                  placeholder="Enter cancellation reason"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
                    disabled={isCancelling}
                  >
                    Close
                  </button>
                  <button
                    onClick={submitCancelRequest}
                    className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2 cursor-pointer"
                    disabled={isCancelling}
                  >
                    {isCancelling && (
                      <ImSpinner8 className="animate-spin text-lg " />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {showReviewModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-2">Leave a Review</h3>

                <label className="block mb-2 font-semibold">Rating:</label>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        setReviewData((prev) => ({ ...prev, rating: num }))
                      }
                      className={`w-8 h-8 rounded-full border cursor-pointer ${
                        reviewData.rating >= num
                          ? "bg-yellow-400"
                          : "bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded mb-4"
                  rows={4}
                  placeholder="Write your review here..."
                />

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;
