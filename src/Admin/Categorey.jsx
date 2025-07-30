import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const Category = () => {
  const [category, setCategory] = useState({
    catId: "",
    cname: "",
    cdescription: "",
    cimgs: [],
  });

  const [editId, setEditId] = useState(null);
  const [previewImgs, setPreviewImgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("add");

  const generateCategoryId = async () => {
    const snapshot = await getDocs(collection(db, "categories"));
    const count = snapshot.size + 1;
    return `CAT${String(count).padStart(3, "0")}`;
  };

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const catList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(catList);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const id = await generateCategoryId();
      setCategory((prev) => ({ ...prev, catId: id }));
      await fetchCategories();
    };
    init();
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const compressedFiles = await Promise.all(
        files.map((file) =>
          imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          })
        )
      );

      const base64Images = await Promise.all(
        compressedFiles.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      setCategory((prev) => ({
        ...prev,
        cimgs: base64Images,
      }));
      setPreviewImgs(base64Images);
      toast.success("Images uploaded & compressed!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to compress or upload images.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { catId, cname, cdescription, cimgs } = category;

    if (!cname || !cdescription || cimgs.length === 0) {
      toast.error("Please fill all required fields and upload images.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...category, createdAt: new Date().toISOString() };

      if (editId) {
        await updateDoc(doc(db, "categories", editId), payload);
        toast.success("Category updated!");
        setEditId(null);
      } else {
        await addDoc(collection(db, "categories"), payload);
        toast.success("Category added!");
      }

      const newId = await generateCategoryId();
      setCategory({ catId: newId, cname: "", cdescription: "", cimgs: [] });
      setPreviewImgs([]);
      document.getElementById("cimgs").value = "";
      await fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category.");
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setCategory({
      catId: cat.catId,
      cname: cat.cname,
      cdescription: cat.cdescription,
      cimgs: cat.cimgs,
    });
    setPreviewImgs(cat.cimgs || []);
    setEditId(cat.id);
    setActiveTab("add");
    toast("Editing category...");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted.");
      await fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category.");
    }
  };

  const handleView = (cat) => {
    toast(`Viewing: ${cat.cname}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
            {editId ? "Edit Category" : "Add New Category"}
          </h2>
          <p className="text-gray-500">
            Fill in the details to {editId ? "update" : "add"} a category.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => {
              setActiveTab("add");
              setCategory({ catId: "", cname: "", cdescription: "", cimgs: [] });
              setEditId(null);
              setPreviewImgs([]);
            }}
            className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium ${
              activeTab === "add"
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Add Category
          </button>
          <button
            onClick={() => setActiveTab("show")}
            className={`px-4 py-2 rounded-full text-sm cursor-pointer font-medium ${
              activeTab === "show"
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-blue-900 hover:bg-gray-200"
            }`}
          >
            Show Categories
          </button>
        </div>
      </div>

      {/* FORM */}
      {activeTab === "add" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 sm:p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          <div>
            <label className="text-sm font-medium">Category ID</label>
            <input
              value={category.catId}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category Name *</label>
            <input
              type="text"
              name="cname"
              value={category.cname}
              onChange={handleChange}
              required
              placeholder="e.g., Shoes, Jackets"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              name="cdescription"
              value={category.cdescription}
              onChange={handleChange}
              rows="2"
              required
              placeholder="Short description..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Upload Category Images *</label>
            <input
              id="cimgs"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1"
              required={!editId}
            />

            {previewImgs.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previewImgs.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Preview ${index}`}
                    className="h-28 sm:h-32 w-full rounded border object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-900 text-white cursor-pointer px-6 py-2 rounded hover:bg-blue-800"
            >
              {loading ? (editId ? "Updating..." : "Adding...") : (editId ? "Update" : "Add")}
            </button>
          </div>
        </form>
      )}

      {/* SHOW TABLE */}
      {activeTab === "show" && (
  <div className="mt-6">
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Existing Categories</h3>

    {/* ✅ Table View for Desktop */}
    <div className="hidden md:block overflow-x-auto w-full shadow rounded-lg">
      <table className="min-w-[600px] w-full text-sm text-left">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-4 py-2">Cat ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Images</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <tr key={cat.id} className="border-t border-gray-300 hover:bg-gray-50">
                <td className="px-4 py-2">{cat.catId}</td>
                <td className="px-4 py-2">{cat.cname}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 flex-wrap">
                    {(cat.cimgs || []).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`cat-${i}`}
                        className="h-12 w-12 object-cover rounded border"
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
  <div className="flex justify-center gap-3 text-gray-600 text-[8px]">
    
    <FaEdit
      onClick={() => handleEdit(cat)}
      className="hover:text-green-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg flex items-center justify-center p-1"
    />
    <FaTrash
      onClick={() => handleDelete(cat.id)}
      className="hover:text-red-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg flex items-center justify-center p-1"
    />
  </div>
</td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500">
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* ✅ Card View for Mobile */}
    <div className="md:hidden grid grid-cols-1 gap-4">
      {categories.length > 0 ? (
        categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">ID: {cat.catId}</p>
                <h4 className="text-lg font-semibold text-blue-900">{cat.cname}</h4>
              </div>
             
  <div className="flex justify-center gap-3 text-gray-600 text-[8px]">
   
    <FaEdit
      onClick={() => handleEdit(cat)}
      className="hover:text-green-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg flex items-center justify-center p-1"
    />
    <FaTrash
      onClick={() => handleDelete(cat.id)}
      className="hover:text-red-600 cursor-pointer border-2 border-gray-300 h-7 w-7 rounded-lg flex items-center justify-center p-1"
    />
  </div>

            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {(cat.cimgs || []).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`cat-mobile-${i}`}
                  className="h-24 w-full object-cover rounded border"
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No categories found.</p>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default Category;
