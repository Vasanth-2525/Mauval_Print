import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";


const getStatusBadge = (status) => {
  const base = "px-2 py-0.5 text-xs rounded font-semibold";
  if (status === "Cancelled") return `${base} bg-red-100 text-red-700`;
  return base;
};

const CancelOrders = () => {
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cancelOrders"));
        const orderList = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }))

        setCancelledOrders(orderList);
      } catch (error) {
        console.error("Error fetching cancelled orders:", error);
        toast.error("Failed to load cancelled orders");
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Cancelled Orders</h2>
        <p className="text-sm text-gray-500">View and manage cancelled orders</p>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {cancelledOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white shadow rounded-xl p-4 gap-4"
            onClick={() => toggleExpand(order.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-blue-800">{order.orderID}</h3>
                <p className="text-sm text-gray-700">{order.name}</p>
              </div>
              <span className={getStatusBadge(order.status)}>{order.status}</span>
            </div>
           
            <p className="text-sm text-gray-600">
              <strong>Amount:</strong> {order.total}
            </p>
            <p  className="text-sm text-gray-600">{order.reason}</p>


            {expandedRows.includes(order.id) && (
              <div className="mt-3 text-sm text-gray-700">
                 <div className="text-sm text-gray-700 mb-2 space-y-1">
                        <p><strong>Name:</strong> {order.checkout?.fullname}</p>
                        <p><strong>Email:</strong> {order.checkout?.email}</p>
                        <p><strong>Address:</strong> {order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}, {order.checkout?.country}</p>
                        <p><strong>Contact:</strong> {order.checkout?.contact}</p>
                      </div>
                <p className="mt-2"><strong>Cart Items:</strong></p>
                <ul className="space-y-3">
                  {order.cart?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="font-medium">{idx + 1}.</span>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.name}</span>
                        <span>Qty: {item.quantity}</span>
                        <span>Price: ₹{item.price}</span>
                        <span>Color: {item.color}</span>
                        <span>Size: {item.size}</span>
                        <span>Total: {item.quantity * item.price}</span>

                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto shadow rounded-lg mt-6">
        <table className="min-w-[900px] w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2" >Reason</th>
              <th className="px-4 py-2">Status</th>

            </tr>
          </thead>
          <tbody className="divide-y">
            {cancelledOrders.map((order) => (
              <React.Fragment key={order.orderID}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpand(order.orderID)}
                >
                  <td className="px-4 py-2 text-blue-600 underline">{order.orderID}</td>
                  <td className="px-4 py-2">{order.checkout?.fullname}</td>

                  <td className="px-4 py-2">{order.total}</td>
                  <td className="px-4 py-2">{order.reason}</td>
                  <td className="px-4 py-2">
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </td>


                </tr>

                {expandedRows.includes(order.orderID) && (
                  <tr>
                    <td colSpan="7" className="bg-gray-50 px-4 py-3">
                      <div className="text-sm text-gray-700 mb-2 space-y-1">
                        <p><strong>Name:</strong> {order.checkout?.fullname}</p>
                        <p><strong>Email:</strong> {order.checkout?.email}</p>
                        <p><strong>Address:</strong> {order.checkout?.street}, {order.checkout?.city}, {order.checkout?.state} - {order.checkout?.zip}, {order.checkout?.country}</p>
                        <p><strong>Contact:</strong> {order.checkout?.contact}</p>
                      </div>
                      <div className="mt-2">
                        <strong>Cart Items:</strong>
                        <ul className="space-y-3">
                          {order.cart?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                              <span className="font-medium">{idx + 1}.</span>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded border"
                              />
                              <div className="flex ">
                                <span span className='mx-3' >{item.name}</span>
                                <span span className='mx-3' >Qty: {item.quantity}</span>
                                <span span className='mx-3' >Price: ₹{item.price}</span>
                                <span span className='mx-3' >Color: {item.color}</span>
                                <span span className='mx-3' >Size: {item.size}</span>
                                <span span className='mx-3' >Total: {item.quantity * item.price}</span>

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
    </div>
  );
};

export default CancelOrders;
