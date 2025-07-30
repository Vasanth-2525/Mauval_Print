import React, { useEffect, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaDownload } from "react-icons/fa";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import * as XLSX from "xlsx";

const ProductList = ({ setSelectedProduct, setActiveTab }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [modalType, setModalType] = useState("");
  const [selectedProduct, setLocalSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) =>
        (a.id || "").localeCompare(b.id || "", undefined, { numeric: true })
      );
      setProducts(data);

      // Extract unique categories
      const uniqueCategories = [
        "All",
        ...new Set(data.map((p) => p.category).filter(Boolean)),
      ];
      setCategoryOptions(uniqueCategories);
    } catch (error) {
      toast.error("Failed to load products.");
    }
  };

  const handleView = (product) => {
    setLocalSelectedProduct(product);
    setModalType("view");
  };

  const handleEdit = async (product) => {
    try {
      const docRef = doc(db, "products", product.docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const fullProduct = { ...docSnap.data(), docId: docSnap.id };
        setSelectedProduct(fullProduct); // send to AddProducts
        setActiveTab("addProduct");
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      toast.error("Error loading product");
      console.error("Error fetching product details:", error);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const toastId = toast.loading("Deleting...");
      await deleteDoc(doc(db, "products", docId));
      toast.success("Deleted!", { id: toastId });
      fetchProducts();
    } catch (error) {
      toast.error("Delete failed.");
    }
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const confirm = window.confirm(
        `Are you sure you want to import ${jsonData.length} products?`
      );
      if (!confirm) return;

      const batchAdd = jsonData.map(async (item, index) => {
        const baseId = item.id?.startsWith("MP") ? item.id : `MP${Date.now()}${index}`;
        const images = item.images
          ? item.images.split(",").map((img) => img.trim())
          : [];

        // Compress image URLs if they are base64
        const compressedImages = await Promise.all(
          images.map(async (img) => {
            if (img.startsWith("data:image")) {
              try {
                const file = await (await fetch(img)).blob();
                const compressed = await imageCompression(file, {
                  maxSizeMB: 0.2,
                  maxWidthOrHeight: 800,
                  useWebWorker: true,
                });
                return await convertToBase64(compressed);
              } catch (error) {
                console.warn("Image compression failed:", error);
                return img; // fallback
              }
            }
            return img; // direct URL
          })
        );

        const stock =
          item.stock && typeof item.stock === "string"
            ? item.stock.split(",").reduce((acc, variant) => {
              const [key, value] = variant.split(":");
              if (key && value) acc[key.trim()] = parseInt(value.trim());
              return acc;
            }, {})
            : {};

        const product = {
          id: baseId,
          name: item.name || "",
          category: item.category || "",
          brand: item.brand || "",
          mrp: Number(item.mrp) || 0,
          salePrice: Number(item.salePrice) || 0,
          offer: Number(item.offer) || 0,
          rating: Number(item.rating) || 0,
          description: item.description || "",
          fabricDetails: item.fabricDetails || "",
          color: item.color || "",
          ourDesign: item.ourDesign?.toString().toLowerCase() === "yes",
          images: compressedImages,
          stock,
          createdAt: new Date(),
        };

        const docRef = doc(db, "products", baseId);
        await setDoc(docRef, product);
      });

      await Promise.all(batchAdd);
      toast.success("Products imported successfully!");
      fetchProducts();
    } catch (err) {
      console.error("Excel upload error:", err);
      toast.error("Failed to import products.");
    }
  };

  // Utility: Convert File/Blob to base64 string
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categoryOptions, setCategoryOptions] = useState(["All"]);
  

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    
    return matchesSearch && matchesCategory ;
  });

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-900">Product List</h2>
        <p className="text-sm text-gray-500">Manage your uploaded product designs here.</p>
        <>
  <div className="flex flex-wrap md:flex-nowrap gap-4 mb-4 items-center py-7 w-full">
    {/* Search */}
    <input
      type="text"
      placeholder="Search by name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 min-w-[150px] bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />

    {/* Category */}
    <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      className="flex-1 min-w-[150px] bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {categoryOptions.map((cat, i) => (
        <option key={i} value={cat}>
          {cat}
        </option>
      ))}
    </select>

    {/* Min Price */}
   

    {/* Reset Filters */}
    <button
      onClick={() => {
        setSearch("");
        setSelectedCategory("All");
        setMinPrice("");
        setMaxPrice("");
      }}
      className="px-4 py-3 bg-gray-200 rounded hover:bg-gray-300 text-sm whitespace-nowrap"
    >
      Reset Filters
    </button>

    {/* Import Button */}
    <div className="flex-shrink-0">
      <input
        type="file"
        accept=".xlsx, .xls"
        id="fileUpload"
        className="hidden"
        onChange={handleFileUpload}
      />
      <button
        onClick={() => document.getElementById("fileUpload").click()}
        className="bg-blue-900 text-white px-4 py-3 rounded flex items-center gap-2 hover:bg-blue-800 text-sm whitespace-nowrap"
      >
        <FaDownload /> Import Product
      </button>
    </div>
  </div>
</>

      </div>




      {/* Table for Desktop */}
      <div className="overflow-x-auto  bg-white rounded shadow hidden md:block">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">MRP</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.docId} className="border-t">
                <td className="px-4 py-3">{p.id}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <img
                    src={p.images?.[0] || "https://via.placeholder.com/80"}
                    alt="product"
                    className="w-8 h-8 object-cover rounded"
                  />
                  {p.name}
                </td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">₹{p.mrp}</td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleView(p)}
                    className="text-gray-600 border border-gray-300 cursor-pointer p-2 rounded hover:text-blue-600"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-gray-600 border border-gray-300 cursor-pointer p-2 rounded hover:text-yellow-600"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(p.docId)}
                    className="text-gray-600 border border-gray-300 cursor-pointer p-2 rounded hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for Mobile */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((p) => (
          <div
            key={p.docId}
            className="bg-white rounded shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <img
                src={p.images?.[0] || "https://via.placeholder.com/80"}
                alt="product"
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <p className="font-semibold text-gray-800">{p.name}</p>
                <p className="text-sm text-gray-600">ID: {p.id}</p>
                <p className="text-sm text-gray-600">Category: {p.category}</p>
                <p className="text-sm text-gray-600">₹{p.mrp}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleView(p)}
                className="text-gray-600 border border-gray-300 cursor-pointer p-2 rounded hover:text-blue-600"
              >
                <FaEye />
              </button>
              <button
                onClick={() => handleEdit(p)}
                className="text-gray-600 border border-gray-300 cursor-pointer p-2 rounded hover:text-yellow-600"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(p.docId)}
                className="text-gray-600 border border-gray-300 cursor-pointer p-2 rounded hover:text-red-600"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* MODAL */}
      {
        modalType === "view" && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-4xl relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => {
                  setModalType("");
                  setLocalSelectedProduct(null);
                }}
                className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>

              <h3 className="text-xl font-bold text-blue-900 mb-4">View Product</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-sm space-y-1">
                  <p><strong>ID:</strong> {selectedProduct.id}</p>
                  <p><strong>Name:</strong> {selectedProduct.name}</p>
                  <p><strong>Category:</strong> {selectedProduct.category}</p>

                  <p><strong>MRP:</strong> ₹{selectedProduct.mrp}</p>
                  <p><strong>Sale Price:</strong> ₹{selectedProduct.salePrice}</p>
                  <p><strong>Offer:</strong> {selectedProduct.offer}%</p>
                  <p><strong>Rating:</strong> {selectedProduct.rating}</p>
                  <p><strong>Description:</strong> {selectedProduct.description}</p>
                  <p><strong>Fabric:</strong> {selectedProduct.fabricDetails}</p>
                  {/* <p><strong>Sizes:</strong> {Object.keys(selectedProduct.stock || {}).join(", ")}</p> */}
                  <p><strong>Colors:</strong> {selectedProduct.color}</p>
                  <p><strong>Our Design:</strong> {selectedProduct.ourDesign ? "Yes" : "No"}</p>
                </div>

                <div>
                  <strong>Images:</strong>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedProduct.images?.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`product-${idx}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >

  );
};

export default ProductList;


