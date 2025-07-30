import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const Invoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: "",
    invoiceDate: "",
    invoiceValue: "",
    invoiceGSTValue: "",
    invoiceTotalValue: "",
    transportAmount: "",
    billPdfBase64: null,
    billPdfName: "",
  });

  const [invoiceList, setInvoiceList] = useState([]);
  const [view, setView] = useState("form");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setInvoiceData((prev) => ({
        ...prev,
        billPdfBase64: reader.result,
        billPdfName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const fetchInvoices = async () => {
    try {
      const snapshot = await getDocs(collection(db, "invoices"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoiceList(data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      toast.error("Failed to fetch invoices.");
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceData.invoiceNo) {
      toast.error("Invoice Number is required.");
      return;
    }

    try {
      await addDoc(collection(db, "invoices"), {
        ...invoiceData,
        createdAt: serverTimestamp(),
      });

      toast.success("Invoice added successfully!");
      setInvoiceData({
        invoiceNo: "",
        invoiceDate: "",
        invoiceValue: "",
        invoiceGSTValue: "",
        invoiceTotalValue: "",
        transportAmount: "",
        billPdfBase64: null,
        billPdfName: "",
      });
      fetchInvoices();
    } catch (error) {
      console.error("Error adding invoice:", error);
      toast.error("Failed to add invoice.");
    }
  };

  const downloadInvoiceExcel = () => {
  if (invoiceList.length === 0) {
    toast.error("No invoices to export.");
    return;
  }

  const excelData = invoiceList.map((invoice,idx) => ({
    "ID":idx+1,
    "Invoice No": invoice.invoiceNo,
    "Invoice Date": invoice.invoiceDate,
    "Invoice Value (₹)": invoice.invoiceValue,
    "GST Value (₹)": invoice.invoiceGSTValue,
    "Transport Amount (₹)": invoice.transportAmount,
    "Total Value (₹)": invoice.invoiceTotalValue,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, "Invoices.xlsx");
};


  return (
    <div className="p-4 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-blue-900">Invoice System</h2>
          <p className="text-sm text-gray-500">Manage invoice records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("form")}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
              view === "form"
                ? "bg-blue-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Add Invoice
          </button>
          <button
            onClick={() => setView("invoice")}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
              view === "invoice"
                ? "bg-blue-900 text-white"
                : "bg-gray-300 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Show Invoices
          </button>
        </div>
      </div>

      {/* === FORM VIEW === */}
      {view === "form" && (
        <form onSubmit={handleAddInvoice} className="grid gap-4 md:grid-cols-2 bg-white p-6 rounded-lg shadow">
          {[
            {
              label: "Invoice Number *",
              name: "invoiceNo",
              placeholder: "e.g., INV001",
            },
            {
              label: "Invoice Date",
              name: "invoiceDate",
              type: "date",
              placeholder: "Select date",
            },
            {
              label: "Invoice Value (₹)",
              name: "invoiceValue",
              type: "number",
              placeholder: "e.g., 1000",
            },
            {
              label: "GST Value (₹)",
              name: "invoiceGSTValue",
              type: "number",
              placeholder: "e.g., 180",
            },
            {
              label: "Total Value (₹)",
              name: "invoiceTotalValue",
              type: "number",
              placeholder: "e.g., 1180",
            },
            {
              label: "Transport Amount (₹)",
              name: "transportAmount",
              type: "number",
              placeholder: "e.g., 50",
            },
          ].map((field, idx) => (
            <div key={idx} >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                name={field.name}
                placeholder={field.placeholder}
                value={invoiceData[field.name]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={field.name === "invoiceNo"}
              />
            </div>
          ))}

          {/* PDF Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Invoice PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full"
            />
            {invoiceData.billPdfName && (
              <p className="text-sm mt-1 text-green-700">
                Selected: {invoiceData.billPdfName}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              className="bg-blue-900 cursor-pointer text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-800"
            >
              Add Invoice
            </button>
          </div>
        </form>
      )}

     {/* === INVOICE VIEW === */}
{view === "invoice" && (
  <div className="mt-6   rounded-lg">
    <div className="flex justify-end mb-4">
          <button
            onClick={downloadInvoiceExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-sm"
          >
            Download Excel
          </button>
        </div>
    {invoiceList.length > 0 ? (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto shadow rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-2">ID </th>
                <th className="px-4 py-2">Invoice No</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Value</th>
                <th className="px-4 py-2">GST</th>
                
                <th className="px-4 py-2">Transport</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{idx+1}</td>
                  <td className="px-4 py-2">{item.invoiceNo}</td>
                  <td className="px-4 py-2">{item.invoiceDate}</td>
                  <td className="px-4 py-2">₹{item.invoiceValue}</td>
                  <td className="px-4 py-2">₹{item.invoiceGSTValue}</td>
                  
                  <td className="px-4 py-2">₹{item.transportAmount}</td>
                  <td className="px-4 py-2 text-green-700 font-semibold">
                    ₹{item.invoiceTotalValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {invoiceList.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-sm">
              <p><span className="font-semibold">Invoice No:</span> {item.invoiceNo}</p>
              <p><span className="font-semibold">Date:</span> {item.invoiceDate}</p>
              <p><span className="font-semibold">Value:</span> ₹{item.invoiceValue}</p>
              <p><span className="font-semibold">GST:</span> ₹{item.invoiceGSTValue}</p>
              <p><span className="font-semibold text-green-700">Total:</span> ₹{item.invoiceTotalValue}</p>
              <p><span className="font-semibold">Transport:</span> ₹{item.transportAmount}</p>
            </div>
          ))}
        </div>
      </>
    ) : (
      <p className="text-center text-gray-500">No invoices found.</p>
    )}
  </div>
)}

    </div>
  );
};

export default Invoice;
