import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const getStatusBadge = (status) => {
  const base = "px-2 py-0.5 text-xs rounded font-semibold";
  if (status === "Delivered") return `${base} bg-green-100 text-green-700`;
  return `${base} bg-gray-100 text-gray-700`;
};

const DeliveryOrders = () => {
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const orderList = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            docId: doc.id,
          }))
          .filter((order) => order.status === "Delivered");

        setDeliveryOrders(orderList);
      } catch (error) {
        console.error("Error fetching delivery orders:", error);
        toast.error("Failed to load delivery orders");
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  const handlePrint = (order) => {
    const cartItems = order.cart || order.items || [];

    const content = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="/logo.png" alt="Company Logo" style="height: 60px; margin-bottom: 10px;" />
        <h2 style="margin: 0; color: #192f59;">Delivery Order Receipt</h2>
        <p style="color: #555;">Thank you for your purchase! Below are the order details.</p>
      </div>

      <hr style="margin: 20px 0;" />

      <p><strong>Order ID:</strong> ${order.orderID}</p>
      <p><strong>Customer:</strong> ${order.checkout?.fullname || order.customerName}</p>
      <p><strong>Amount:</strong> ₹${order.total}</p>
      <p><strong>Status:</strong> ${order.status}</p>

      <p><strong>Delivery Address:</strong><br />
        ${order.checkout?.street || order.address},<br />
        ${order.checkout?.city || ""}, ${order.checkout?.state || ""} - ${order.checkout?.zip || ""},<br />
        ${order.checkout?.country || ""}
      </p>

      <p><strong>Contact:</strong> ${order.checkout?.contact || order.customerPhone}</p>

      <h4 style="margin-top: 30px; color: #192f59;">Ordered Items:</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ccc;">Image</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Product</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Size</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Color</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ccc;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems
            .map((item) => {
              const actualItem = item.items || item;
              const img =
                actualItem.image ||
                actualItem.customizedImage ||
                "/placeholder.jpg";

              return `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
                  <img src="${img}" alt="Image" style="width:40px; height:40px; object-fit:cover;" />
                </td>
                <td style="padding: 8px; border: 1px solid #ccc;">${
                  actualItem.name || actualItem.fullname
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${
                  actualItem.size || "-"
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${
                  actualItem.color || "-"
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">₹${
                  item.price
                }</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>

      <hr style="margin: 20px 0;" />

      <p style="text-align: center; font-size: 14px; color: #666;">
        This is a system-generated receipt. For any queries, contact us at support@example.com
      </p>
    </div>
    `;

    const printWindow = window.open("", "", "width=900,height=650");
    printWindow.document.write(`
      <html>
        <head>
          <title>Order - ${order.orderID}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 10px; }
            p, ul { margin: 5px 0; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const downloadExcel = () => {
    if (deliveryOrders.length === 0) {
      toast.error("No delivery data to export");
      return;
    }

    const excelData = deliveryOrders.map((order,idx) => ({
      "ID":idx+1,
      "Order ID": order.orderID,
      "Customer Name": order.checkout?.fullname || order.customerName,
      Email: order.checkout?.email || "",
      Contact: order.checkout?.contact || order.customerPhone,
      Address: `${order.checkout?.street || order.address}, ${order.checkout?.city || ""}, ${order.checkout?.state || ""} - ${order.checkout?.zip || ""}, ${order.checkout?.country || ""}`,
      "Amount (₹)": order.total,
      Status: order.status,
      "Customer Type": order.shopCustomerType || "Online",
      Items: (order.cart || order.items || [])
        .map((item) => {
          const actualItem = item.items || item;
          return `${actualItem.name || actualItem.fullname} (Size: ${
            actualItem.size || " "
          }, Color: ${actualItem.color || "-"}, Qty: ${item.quantity})`;
        })
        .join("; "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Orders");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Delivery_Orders.xlsx");
  };


  return (
    <div className="p-4 min-h-screen ">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Delivery Orders</h2>
        <p className="text-sm text-gray-500">View and manage delivery orders</p>
      </div>

       <div className="flex justify-end mb-4">
        <button
          onClick={downloadExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-sm"
        >
          Download Excel
        </button>
      </div>

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        {deliveryOrders.map((order) => (
          <div
            key={order.orderID}
            onClick={() => toggleExpand(order.orderID)}
            className="border-gray-300 bg-white shadow rounded-xl p-4 gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-blue-800">{order.orderID}</h3>
                <p className="text-sm text-gray-700">{order.checkout?.fullname || order.customerName}</p>
              </div>
              <span className={getStatusBadge(order.status)}>{order.status}</span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              <strong>Amount:</strong> ₹{order.total}
            </p>


            {expandedRows.includes(order.orderID) && (
              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <div className="text-sm text-gray-700 mb-2 space-y-1">
          
                  
                  <div className="text-sm text-gray-700 mb-2 space-y-1">
                        <p><strong>Name:</strong> {order.checkout?.fullname || order.customerName}</p>
                        <p><strong>Email:</strong> {order.checkout?.email || " "}</p>
                        <p><strong>Address:</strong> {order.checkout?.street || order.address}, {order.checkout?.city || ""}, {order.checkout?.state || ""} - {order.checkout?.zip || ""}, {order.checkout?.country || ""}</p>
                        <p><strong>Contact:</strong> {order.checkout?.contact || order.customerPhone}</p>
                      </div>
                 
                  <p className="px-4 py-2">{order.shopCustomerType || "Online"}</p>
                  <p className="px-4 py-2">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </p>
                </div>

                <p className="mt-2"><strong>Cart Items:</strong></p>
                <ul className="space-y-3 ml-6 mt-1">
                  {(order.cart || order.items || []).map((item, idx) => {
                    const actualItem = item.items || item;

                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="font-medium">{idx + 1}.</span>
                        <img
                          src={actualItem.images?.[0] || actualItem.image || actualItem.customizedImage || "/placeholder.jpg"}
                          alt={actualItem.name || "Product Image"}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold">{actualItem.fullname}</span>
                          <span>Color: {item.color}</span>
                          <span>Size: {item.size}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>Price: ₹{item.price}</span>
                          <span>Total: ₹{item.quantity * item.price}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrint(order);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"
              >
                Print
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto shadow rounded-lg mt-6">
        <table className="min-w-[900px] w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Customer Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deliveryOrders.map((order) => (
              <React.Fragment key={order.orderID}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpand(order.orderID)}
                >
                  <td className="px-4 py-2 text-blue-600 underline">{order.orderID}</td>
                  <td className="px-4 py-2">{order.checkout?.fullname || order.customerName}</td>
                  <td className="px-4 py-2">₹{order.total}</td>
                  <td className="px-4 py-2">{order.shopCustomerType || "Online"}</td>
                  <td className="px-4 py-2">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </td>

                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(order);
                      }}
                      className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-3 py-1 rounded text-xs"
                    >
                      Print
                    </button>
                  </td>
                </tr>
                {expandedRows.includes(order.orderID) && (
                  <tr>
                    <td colSpan="6" className="bg-gray-50 px-4 py-3">
                      <div className="text-sm text-gray-700 mb-2 space-y-1">
                        <p><strong>Name:</strong> {order.checkout?.fullname || order.customerName}</p>
                        <p><strong>Email:</strong> {order.checkout?.email || " "}</p>
                        <p><strong>Address:</strong> {order.checkout?.street || order.address}, {order.checkout?.city || ""}, {order.checkout?.state || ""} - {order.checkout?.zip || ""}, {order.checkout?.country || ""}</p>
                        <p><strong>Contact:</strong> {order.checkout?.contact || order.customerPhone}</p>
                      </div>

                      <div className="mt-2">
                        <strong>Cart Items:</strong>
                        <ul className="space-y-3 ml-6 mt-1">
                          {(order.cart || order.items || []).map((item, idx) => {
                            const actualItem = item.items || item;

                            return (
                              <li key={idx} className="flex items-start gap-3  text-sm text-gray-700">
                                <span className="font-medium">{idx + 1}.</span>
                                <img
                          src={actualItem.images?.[0] || actualItem.image || actualItem.customizedImage || "/placeholder.jpg"}
                          alt={actualItem.name || "Product Image"}
                          className="w-12 h-12 object-cover rounded border"
                        />
                                <div className="flex ">
                                  <span className='mx-3' >{actualItem.name}</span>
                                  <span className='mx-3'>Color: {item.color}</span>
                                  <span className='mx-3'>Size: {item.size}</span>
                                  <span className='mx-3'>Qty: {item.quantity}</span>
                                  <span className='mx-3'>Price: ₹{item.price}</span>
                                  <span className='mx-3'>Total: ₹{item.quantity * item.price}</span>
                                 
                                </div>
                                
                              </li>
                            );
                          })}
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
    </div>
  );
};

export default DeliveryOrders;


