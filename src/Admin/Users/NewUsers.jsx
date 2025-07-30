import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const NewUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);
  
const fetchUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    const todayStr = new Date().toISOString().split("T")[0]; 

    const data = snapshot.docs.map((doc) => {
      const userData = doc.data();

      let createdDate = null;

      if (userData.createdAt?.toDate) {
        createdDate = userData.createdAt.toDate(); 
      } else if (typeof userData.createdAt === "string") {
        createdDate = new Date(userData.createdAt); 
      }

      return {
        id: doc.id,
        ...userData,
        createdAt: createdDate,
        name: userData.username || userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        image: userData.photoURL || "",
        role: userData.role || "",
      };
    });

    const todayUsers = data.filter(
      (user) =>
        user.createdAt &&
        user.createdAt.toISOString().split("T")[0] === todayStr
    );

    setUsers(todayUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};


  const today = new Date().toISOString().split("T")[0];

  const newUsers = users.filter(
    (user) => user.createdAt?.toISOString().split("T")[0] === today
  );
  const oldUsers = users.filter(
    (user) => user.createdAt?.toISOString().split("T")[0] !== today
  );

  const handleView = (user) => {
    setSelectedUser({ ...user });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setEditMode(true);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedUser((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone,
        image: selectedUser.photoURL,
        role: selectedUser.role ,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
      );
      setShowModal(false);
      alert("User updated in Firestore!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("User deleted from Firestore.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete user.");
    }
  };

  const renderUsers = (userList) => (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4 mt-4">
        {userList.map((user, index) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="flex items-center gap-3">
              <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">{ user.fullName || user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-600">{user.role}</p>
                <p className="text-sm text-gray-600">{user.phone}</p>
                <p className="text-xs text-gray-400">{user.createdAt?.toDateString?.()}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => handleView(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-blue-600 hover:bg-blue-50">
                <FaEye />
              </button>
              <button onClick={() => handleEditClick(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-yellow-600 hover:bg-yellow-50">
                <FaEdit />
              </button>
              <button onClick={() => handleDelete(user.id)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-red-600 hover:bg-red-50">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto mt-4">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Profile</th>
              <th className="p-3">Name</th>
              
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Phone</th>
              
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {userList?.map((user, index) => (
              <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">
                  <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full" />
                </td>
                

                <td className="p-3">{user.fullName || user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">{user.phone}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleView(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-blue-600 hover:bg-blue-50">
                      <FaEye />
                    </button>
                    <button onClick={() => handleEditClick(user)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-yellow-600 hover:bg-yellow-50">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-gray-600 border p-2 rounded cursor-pointer hover:text-red-600 hover:bg-red-50">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="p-4 min-h-screen">
      <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-1">New Users</h2>
      <p className="text-sm text-gray-500 mb-4">Users who registered today</p>
      {users.length > 0 ? renderUsers(users) : <p>No users found.</p>}

      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-blue-900">
              {editMode ? "Edit User" : "User Details"}
            </h3>
            <img
              src={selectedUser.image}
              alt={selectedUser.name}
              className="w-20 h-20 rounded-full mx-auto"
            />
            {editMode && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm"
              />
            )}
            <div className="space-y-2">
              <input
                name="name"
                value={selectedUser.name}
                onChange={handleInputChange}
                readOnly={!editMode}
                className={`w-full border px-3 py-2 rounded-md ${!editMode && "bg-gray-100"}`}
                placeholder="Name"
              />
              <input
                name="email"
                value={selectedUser.email}
                onChange={handleInputChange}
                readOnly={!editMode}
                className={`w-full border px-3 py-2 rounded-md ${!editMode && "bg-gray-100"}`}
                placeholder="Email"
              />
                             <select
  name="role"
  value={selectedUser.role}
  onChange={(e) =>
    setSelectedUser((prev) => ({ ...prev, role: e.target.value }))
  }
  disabled={!editMode}
  className={`w-full border px-3 py-2 rounded-md ${!editMode && "bg-gray-100"}`}
>
  <option value="">Select Role</option>
  <option value="admin">Admin</option>
  <option value="user">User</option>
</select>
              <input
                name="phone"
                value={selectedUser.phone}
                onChange={handleInputChange}
                readOnly={!editMode}
                className={`w-full border px-3 py-2 rounded-md ${!editMode && "bg-gray-100"}`}
                placeholder="Phone"
              />
            </div>
            {editMode && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Update
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewUsers;
