import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const OldUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map((doc) => {
          const user = doc.data();
          return {
            id: doc.id,
            name: user.fullName || user.name || user.username  ||  "",
            email: user.email || "",
            phone: user.phone || "",
            image: user.photoURL || "https://via.placeholder.com/100",
            role:user.role ||  ""
          };
        });
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleView = (user) => {
    setSelectedUser(user);
    setEditMode(false);
  };

  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setEditMode(true);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone,
        role:selectedUser.role,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
      );
      setSelectedUser(null);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="p-4 min-h-screen relative">
      <h2 className="text-2xl font-bold text-blue-900 mb-2">Old Users</h2>
      <p className="text-sm text-gray-500 mb-4">View, edit, or delete users.</p>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
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
            {users.map((user, index) => (
              <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>
                <td className="p-3">{user.fullName ||  user.username || user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">{user.phone}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleView(user)}
                      className="text-gray-600 hover:text-blue-600 border border-gray-300 cursor-pointer rounded p-2"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-gray-600 hover:text-yellow-600 border border-gray-300 cursor-pointer rounded p-2"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-600 hover:text-red-600 border border-gray-300 cursor-pointer rounded p-2"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white shadow rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-4">
              <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="font-bold text-blue-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">{user.role}</p>
              </div>
            </div>
            <p className="text-sm">Phone: {user.phone}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleView(user)}
                className="text-gray-600 border p-2 rounded hover:text-blue-600 hover:bg-blue-50"
              >
                <FaEye />
              </button>
              <button
                onClick={() => handleEdit(user)}
                className="text-gray-600 border p-2 rounded hover:text-yellow-600 hover:bg-yellow-50"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="text-gray-600 border p-2 rounded hover:text-red-600 hover:bg-red-50"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 relative">
            <button
              onClick={() => setSelectedUser(null)}
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
            <div className="space-y-2">
              <input
                name="name"
                value={selectedUser.name}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, name: e.target.value }))
                }
                readOnly={!editMode}
                className={`w-full border px-3 py-2 rounded-md ${!editMode && "bg-gray-100"}`}
                placeholder="Name"
              />
              <input
                name="email"
                value={selectedUser.email}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, email: e.target.value }))
                }
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
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev, phone: e.target.value }))
                }
                readOnly={!editMode}
                className={`w-full border px-3 py-2 rounded-md ${!editMode && "bg-gray-100"}`}
                placeholder="Phone"
              />
            </div>
            <div className="flex justify-end gap-2">
              {editMode && (
                <button
                  onClick={handleUpdate}
                  className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Update
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OldUsers;


