import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";

const AddProducts = ({ selectedProduct, setSelectedProduct, setActiveTab }) => {
  const [product, setProduct] = useState({
    id: "",
    productTitle: "",
    name: "",
    category: "",
    color: [],
    size: [],
    offer: 0,
    rating: 0,
    mrp: 0,
    salePrice: 0,
    stock: 0,
    description: "",
    fabricDetails: "",
    images: [],
    ourDesign: true,
  });

  const [stockByVariant, setStockByVariant] = useState({});
  const [previewImg, setPreviewImg] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  

  const resetForm = () => {
    setProduct({
      id: "",
      productTitle: "",
      name: "",
      category: "",
      color: [],
      size: [],
      offer: 0,
      rating: 0,
      mrp: 0,
      salePrice: 0,
      stock: 0,
      description: "",
      fabricDetails: "",
      images: [],
      ourDesign: true,
    });
    setStockByVariant({});
    setPreviewImg([]);
    generateNextProductId();
  };

  const generateNextProductId = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const ids = snapshot.docs
        .map((doc) => doc.data().id)
        .filter((id) => id && id.startsWith("MP"))
        .map((id) => parseInt(id.replace("MP", ""), 10))
        .filter((num) => !isNaN(num));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const nextId = `MP${String(maxId + 1).padStart(3, "0")}`;
      setProduct((prev) => ({ ...prev, id: nextId }));
    } catch (error) {
      toast.error("Could not generate product ID");
    }
  };

  useEffect(() => {
    if (!selectedProduct) generateNextProductId();
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedProduct.docId) {
      setProduct({ ...selectedProduct });
      setStockByVariant(selectedProduct.stockByVariant || {});
      setPreviewImg(selectedProduct.images || []);
    } else {
      resetForm();
    }
  }, [selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    try {
      const compressed = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        )
      );
      const base64Images = await Promise.all(
        compressed.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
      setProduct((prev) => ({ ...prev, images: base64Images }));
      setPreviewImg(base64Images);
      toast.success("Images uploaded & compressed!");
    } catch (error) {
      toast.error("Failed to compress or upload images.");
    }
  };

  const handleVariantStockChange = (color, size, value) => {
    const key = `${color}-${size}`;
    const qty = parseInt(value, 10) || 0;
    setStockByVariant((prev) => ({ ...prev, [key]: qty }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const requiredFields = ["id", "productTitle", "name", "category", "mrp", "salePrice", "description"];
    const missingFields = requiredFields.filter((field) => !product[field]);

    if (!product.color.length || !product.size.length) {
      toast.error("Select at least one color and one size.");
      setLoading(false);
      return;
    }

    if (missingFields.length > 0) {
      toast.error(`Fill in: ${missingFields.join(", ")}`);
      setLoading(false);
      return;
    }

    const totalStock = Object.values(stockByVariant).reduce((a, b) => a + b, 0);
    const finalProduct = {
      ...product,
      stock: totalStock,
      stockByVariant,
      mrp: Number(product.mrp),
      salePrice: Number(product.salePrice),
      offer: Number(product.offer) || 0,
      rating: Number(product.rating) || 0,
      updatedAt: new Date(),
    };

    try {
      if (selectedProduct?.productId) {
        await updateDoc(doc(db, "products", selectedProduct.productId), finalProduct);
        toast.success("Product updated!");
      } else {
        const docRef = await addDoc(collection(db, "products"), {
          ...finalProduct,
          createdAt: new Date(),
        });
        await updateDoc(docRef, { productId: docRef.id });
        toast.success("Product added!");
      }
      resetForm();
      setSelectedProduct(null);
    } catch (err) {
      toast.error("Error submitting product.");
    }

    setLoading(false);
  };


 

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const categoryList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);



  const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      <h2 className="text-3xl font-bold text-blue-900 mb-6">
        {selectedProduct ? "Edit Product" : "Add New Product"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product ID</label>
          <input type="text" name="id" value={product.id} readOnly className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100" />
        </div>

        {["productTitle", "name"].map((name, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700">
              {name === "productTitle" ? "Product Title *" : "Product Name *"}
            </label>
            <input
              type="text"
              name={name}
              value={product[name]}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder={name === "productTitle" ? "e.g. Printed Oversized T-Shirt" : "e.g. Oversized Tee"}
            />
          </div>
        ))}

         <div>
      <label className="block text-sm font-medium text-gray-700">
        Category *
      </label>
      <select
        name="category"
        value={product.category}
        onChange={handleInputChange}
        required
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.cname}>
            {cat.cname}
          </option>
        ))}
      </select>
    </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Colors *</label>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <label key={color} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={color}
                  checked={product.color.includes(color)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setProduct((prev) => ({
                      ...prev,
                      color: checked ? [...prev.color, color] : prev.color.filter((c) => c !== color),
                    }));
                  }}
                />
                {color}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sizes *</label>
          <div className="grid grid-cols-3 gap-2">
            {sizes.map((size) => (
              <label key={size} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={size}
                  checked={product.size.includes(size)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setProduct((prev) => ({
                      ...prev,
                      size: checked ? [...prev.size, size] : prev.size.filter((s) => s !== size),
                    }));
                  }}
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        {product.color.length > 0 && product.size.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Quantity per Variant</label>
            <table className="min-w-full border border-gray-200 shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-[#192f59] text-white">
                <tr>
                  <th className=" px-2 py-1 ">C\S</th>
                  {product.size.map((s) => (
                    <th key={s} className=" px-2 py-1">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {product.color.map((c) => (
                  <tr key={c}>
                    <td className="border-2 border-b border-gray-300 px-2 py-1 font-medium ">{c}</td>
                    {product.size.map((s) => {
                      const key = `${c}-${s}`;
                      return (
                        <td key={key} className="border-2 border-b border-gray-300 px-1 py-1">
                          <input
                            type="number"
                            value={stockByVariant[key] || ""}
                            min="0"
                            placeholder="0"
                            onChange={(e) => handleVariantStockChange(c, s, e.target.value)}
                            className="w-10 px-2 py-1 border-2 border-b border-gray-300 rounded"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-gray-600 mt-2">
              Total Stock: <strong>{Object.values(stockByVariant).reduce((a, b) => a + b, 0)}</strong>
            </p>
          </div>
        )}

        {[
          { label: "Offer (%)", name: "offer" },
          { label: "Rating", name: "rating" },
          { label: "MRP (₹)", name: "mrp", required: true },
          { label: "Sale Price (₹)", name: "salePrice", required: true },
        ].map(({ label, name, required }, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700">{label} {required ? "*" : ""}</label>
            <input
              type="number"
              name={name}
              value={product[name]}
              onChange={handleInputChange}
              required={required}
              placeholder={
                name === "offer" ? "e.g. 10"
                : name === "rating" ? "e.g. 4.5"
                : name === "mrp" ? "e.g. 999"
                : name === "salePrice" ? "e.g. 799"
                : ""
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        ))}

        {[
          { label: "Description *", name: "description", required: true },
          { label: "Fabric Details", name: "fabricDetails" },
        ].map(({ label, name, required }, i) => (
          <div key={i} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <textarea
              name={name}
              value={product[name]}
              onChange={handleInputChange}
              required={required}
              rows={3}
              placeholder={
                name === "description"
                  ? "Describe the product features, material, fit etc."
                  : "e.g. 100% Cotton, 240 GSM"
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        ))}

        <div className="md:col-span-2 flex items-center">
          <input
            type="checkbox"
            name="ourDesign"
            checked={product.ourDesign}
            onChange={(e) => setProduct((prev) => ({ ...prev, ourDesign: e.target.checked }))}
            className="h-4 w-4 mr-2"
          />
          <label htmlFor="ourDesign" className="text-sm font-medium text-gray-700">
            Our Design Product
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Images (max 4) — JPG/PNG, under 200KB each
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="mt-1 text-sm"
          />
          <div className="mt-4 flex gap-4 flex-wrap">
            {previewImg.map((img, i) => (
              <img key={i} src={img} alt="preview" className="w-24 h-24 object-cover rounded border" />
            ))}
          </div>
        </div>

        <div className="md:col-span-2 text-right">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-900 cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-800"
          >
            {loading ? "Processing..." : selectedProduct ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProducts;
