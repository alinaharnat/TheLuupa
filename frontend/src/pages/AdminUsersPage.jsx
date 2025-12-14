import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Edit2, Trash2, X, Search } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const [editError, setEditError] = useState("");
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        if (userData.role !== "admin") {
          navigate("/");
          return;
        }

        setUser(userData);

        if (!initialLoadDone.current) {
          fetchUsers(userData.token);
          initialLoadDone.current = true;

          const freshData = await refreshUserData();
          if (freshData && freshData.role !== "admin") {
            navigate("/");
          }
        }
      } else {
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query) ||
            u.userId.toString().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async (token) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (userToEdit) => {
    setEditForm({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
    });
    setEditError("");
    setEditModal({ isOpen: true, user: userToEdit });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, user: null });
    setEditForm({ name: "", email: "", role: "" });
    setEditError("");
  };

  const openDeleteModal = (userToDelete) => {
    setDeleteModal({ isOpen: true, user: userToDelete });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setProcessingId(editModal.user._id);

    try {
      await axios.put(
        `/api/admin/users/${editModal.user._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      fetchUsers(user.token);
      closeEditModal();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    setProcessingId(deleteModal.user._id);

    try {
      await axios.delete(`/api/admin/users/${deleteModal.user._id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      fetchUsers(user.token);
      closeDeleteModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "carrier":
        return "bg-blue-100 text-blue-800";
      case "passenger":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#CDEEF2]">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow bg-[#CDEEF2] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#096B8A]" />
                <h1 className="text-2xl font-semibold text-[#064d63]">Manage Users</h1>
              </div>
              <span className="text-gray-500 text-sm">{users.length} users total</span>
            </div>

            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, role, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#096B8A] focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {searchQuery ? "No users found matching your search." : "No users found."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{u.userId}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{u.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-2 text-[#096B8A] hover:bg-[#096B8A] hover:text-white rounded-md transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              disabled={u._id === user._id.replace(/"/g, '')}
                              className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500"
                              title={u._id === user._id.replace(/"/g, '') ? "Cannot delete yourself" : "Delete user"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#064d63]">Edit User</h2>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#096B8A] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#096B8A] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#096B8A] focus:border-transparent"
                    required
                  >
                    <option value="passenger">Passenger</option>
                    <option value="carrier">Carrier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={processingId}
                  className="flex-1 py-2 bg-[#096B8A] text-white rounded-md font-medium hover:bg-[#064d63] transition-colors disabled:bg-gray-400"
                >
                  {processingId ? "Saving..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={processingId}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-semibold text-[#064d63] mb-4">Delete User?</h2>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deleteModal.user?.name}</strong>?
            </p>
            <p className="text-gray-500 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={processingId}
                className="flex-1 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors disabled:bg-gray-400"
              >
                {processingId ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={closeDeleteModal}
                disabled={processingId}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminUsersPage;
