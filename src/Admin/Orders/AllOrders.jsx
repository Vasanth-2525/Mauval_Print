
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";

const getStatusBadge = (status) => {
  const base = "text-xs font-medium rounded px-2 py-1";
  switch (status) {
    case "Place Order":
      return `${base} bg-blue-100 text-blue-800`;
    case "Packed":
      return `${base} bg-purple-100 text-purple-800`;
    case "Shipped":
      return `${base} bg-indigo-100 text-indigo-800`;
    case "Delivered":
      return `${base} bg-green-100 text-green-800`;
    case "Cancelled":
      return `${base} bg-red-100 text-red-700`;
    case "Add More":
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return base;
  }
};

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [cancellationInput, setCancellationInput] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orderList = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            docId: doc.id,
          }))
          .filter(
            (order) =>
              order.status !== "Delivered" && order.status !== "Cancelled"
          );

        setOrders(orderList);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = (orderID) => {
    setExpandedRows((prev) =>
      prev.includes(orderID)
        ? prev.filter((row) => row !== orderID)
        : [...prev, orderID]
    );
  };

  const handleStatusChange = async (orderID, newStatus) => {
    const orderToUpdate = orders.find((order) => order.orderID === orderID);
    if (!orderToUpdate) return;

    if (newStatus === "Cancelled") {
      setCancellationInput((prev) => ({ ...prev, [orderID]: true }));
      return;
    }

    try {
      await updateDoc(doc(db, "orders", orderToUpdate.docId), {
        status: newStatus,
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.orderID === orderID ? { ...order, status: newStatus } : order
        )
      );

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleCancelSubmit = async (orderID, reason) => {
    const order = orders.find((o) => o.orderID === orderID);
    if (!order) return;

    try {
      await updateDoc(doc(db, "orders", order.docId), {
        status: "Cancelled",
      });

      await addDoc(collection(db, "cancelOrders"), {
        ...order,
        cancelledAt: new Date().toISOString(),
        reason,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.orderID === orderID ? { ...o, status: "Cancelled" } : o
        )
      );

      setCancellationInput((prev) => {
        const updated = { ...prev };
        delete updated[orderID];
        return updated;
      });

      toast.success("Order cancelled and stored successfully");
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order");
    }
  };

  const handlePrint = (order) => {
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 10px; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="/logo.png" alt="Company Logo" style="height: 60px; margin-bottom: 10px;" />
          <h2 style="margin: 0; color: #192f59;">Order Receipt</h2>
          <p style="color: #555;">Thank you for shopping with us!</p>
        </div>

        <hr style="margin: 20px 0;" />

        <p><strong>Order ID:</strong> ${order.orderID}</p>
        <p><strong>Customer:</strong> ${order.checkout?.fullname}</p>
        <p><strong>Amount:</strong> ₹${order.total}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        

        <p><strong>Delivery Address:</strong><br />
          ${order.checkout?.street},<br />
          ${order.checkout?.city}, ${order.checkout?.state} - ${order.checkout?.zip},<br />
          ${order.checkout?.country}
        </p>

        <p><strong>Contact:</strong> ${order.checkout?.contact}</p>

        <h4 style="margin-top: 30px; color: #192f59;">Cart Items:</h4>
         <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background-color: #f3f3f3;">
        <th style="border: 1px solid #ccc; padding: 8px;">Image</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Product</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Qty</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Size</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Color</th>
        <th style="border: 1px solid #ccc; padding: 8px;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${order.cart
        ?.map(
          (item) => `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">
            <img src="${item.image || item.customizedImage || '/placeholder.jpg'}"
                 alt="${item.name}"
                 style="width: 40px; height: 40px; object-fit: cover;" />
          </td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.name}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.quantity}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.size || "-"}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${item.color || "-"}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">₹${item.price}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>

        <hr style="margin: 20px 0;" />

        <p style="text-align: center; font-size: 14px; color: #666;">
          This receipt is system-generated. For support, contact support@example.com
        </p>
      </div>
    `;

    const printWindow = window.open("", "", "width=900,height=650");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order - ${order.orderID}</title>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">All Orders</h2>
        <p className="text-sm text-gray-500">Manage all customer orders here</p>
      </div>

      <div className="hidden md:block overflow-x-auto shadow rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <React.Fragment key={order.orderID}>
                <tr className="border-gray-300 hover:bg-gray-50">
                  <td
                    className="px-4 py-2 text-blue-700 cursor-pointer hover:underline"
                    onClick={() => toggleExpand(order.orderID)}
                  >
                    {order.orderID}
                  </td>
                  <td className="px-4 py-2">{order.checkout?.fullname}</td>
                  <td className="px-4 py-2">{order.total}</td>
                  <td className="px-4 py-2">{order.paymentID}</td>
                  <td className="px-4 py-2">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.orderID, e.target.value)
                      }
                      className={`${getStatusBadge(order.status)} w-full max-w-[150px]`}
                    >
                      <option value="Place Order">Place Order</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Add More">Add More</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handlePrint(order)}
                      className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-3 py-1 rounded text-xs"
                    >
                      Print
                    </button>
                  </td>
                </tr>

                {/* Show cancellation input */}
                {cancellationInput[order.orderID] && (
                  <tr>
                    <td colSpan="6" className="px-4 py-2 bg-red-50">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <input
                          type="text"
                          placeholder="Reason for cancellation"
                          className="border border-gray-300 px-3 py-1 rounded w-full sm:w-1/2"
                          onChange={(e) =>
                            setCancellationInput((prev) => ({
                              ...prev,
                              [order.orderID]: {
                                ...(typeof prev[order.orderID] === "object"
                                  ? prev[order.orderID]
                                  : {}),
                                reason: e.target.value,
                              },
                            }))
                          }
                        />
                        <button
                          onClick={() =>
                            handleCancelSubmit(
                              order.orderID,
                              cancellationInput[order.orderID]?.reason || ""
                            )
                          }
                          className="bg-red-600 text-white px-4 py-1.5 rounded text-sm"
                        >
                          Submit Cancellation
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded row for order details */}
                {expandedRows.includes(order.orderID) && (
                  <tr className="bg-gray-50 border-t">
                    <td colSpan="6" className="px-4 py-3">
                      <div className="text-sm text-gray-700 mb-2 space-y-1">
                        <p>
                          <strong>Name:</strong> {order.checkout?.fullname}
                        </p>
                        <p>
                          <strong>Email:</strong> {order.checkout?.email}
                        </p>
                        <p>
                          <strong>Address:</strong> {order.checkout?.street},{" "}
                          {order.checkout?.city}, {order.checkout?.state} -{" "}
                          {order.checkout?.zip}, {order.checkout?.country}
                        </p>
                        <p>
                          <strong>Contact:</strong> {order.checkout?.contact}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium text-sm mb-1">Cart Items:</p>
                        <ul className="space-y-3">
                          {order.cart?.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 text-sm text-gray-700"
                            >
                              <span className="font-medium">{idx + 1}.</span>
                              <img
                                src={item.image || item.customizedImage ||item.images?.[0]}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded border"
                              />
                              <div className="flex flex-col ">
                                <span className="font-semibold ">{item.name}     {item.color === "" && (
                                  <a
                                    href={item.customizedImage || item.image}
                                    download={`customized-${item.name || "image"}.jpg`}
                                    className="text-white bg-gray-800 ml-2  py-2 px-3 rounded-lg mt-1 text-xs"
                                  >
                                    Download Image
                                  </a>
                                )}</span>
                                <div className="mt-5">
                                <span className="mx-2">Qty: {item.quantity}</span>
                                <span className="mx-2">Price: ₹{item.price}</span>
                                <span className="mx-2">Color: {item.color}</span>
                                <span className="mx-2">Size: {item.size}</span>
                                <span className="mx-2">Total: ₹{item.quantity * item.price}</span>

                                </div>

                            
                              </div>
                            </li>
                          ))}
                        </ul>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 mt-6">
        {orders.map((order) => (
          <div
            key={order.orderID}
            className="border-gray-300 bg-white shadow rounded-xl p-4 gap-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-blue-900">{order.orderID}</h3>
              <span className={`${getStatusBadge(order.status)}`}>{order.status}</span>
            </div>

            <p className="text-sm text-gray-600 mb-1"><strong>Customer:</strong> {order.checkout?.fullname}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Amount:</strong> ₹{order.total}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Payment ID:</strong> {order.paymentID}</p>

            <div className="my-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Change Status</label>
              <select
                value={order.status}
                onChange={(e) =>
                  handleStatusChange(order.orderID, e.target.value)
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="Place Order">Place Order</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Add More">Add More</option>
              </select>
            </div>

            {cancellationInput[order.orderID] && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Reason for cancellation"
                  className="w-full border border-gray-300 px-3 py-1 rounded"
                  onChange={(e) =>
                    setCancellationInput((prev) => ({
                      ...prev,
                      [order.orderID]: {
                        ...(typeof prev[order.orderID] === "object"
                          ? prev[order.orderID]
                          : {}),
                        reason: e.target.value,
                      },
                    }))
                  }
                />
                <button
                  onClick={() =>
                    handleCancelSubmit(
                      order.orderID,
                      cancellationInput[order.orderID]?.reason || ""
                    )
                  }
                  className="w-full bg-red-600 text-white py-1.5 rounded text-sm"
                >
                  Submit Cancellation
                </button>
              </div>
            )}

            <div className="flex justify-between mt-4 gap-2">
              <button
                onClick={() => toggleExpand(order.orderID)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-sm py-1 rounded"
              >
                {expandedRows.includes(order.orderID) ? "Hide" : "Details"}
              </button>
              <button
                onClick={() => handlePrint(order)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 rounded"
              >
                Print
              </button>
            </div>

            {/* Expand details */}
            {expandedRows.includes(order.orderID) && (
              <div className="mt-4 text-sm text-gray-700 space-y-1">
                <p><strong>Email:</strong> {order.checkout?.email}</p>
                <p><strong>Contact:</strong> {order.checkout?.contact}</p>
                <p><strong>Address:</strong> {order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}, {order.checkout?.country}</p>
                <p className="mt-2 font-medium">Cart Items:</p>
                <ul className="space-y-2 mt-1">
                  {order.cart?.map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover border rounded"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p>Qty: {item.quantity}</p>
                        <span>Color: {item.color}</span>
                        <span>Size: {item.size}</span>
                        <p>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default AllOrders;



