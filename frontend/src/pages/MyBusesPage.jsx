import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bus,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Users,
  Wifi,
  Wind,
  Tv,
  Usb,
  Armchair,
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const MyBusesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    busName: "",
    numberPlate: "",
    capacity: 40,
    busType: "standard",
    amenities: [],
  });

  const amenityOptions = [
    { value: "wifi", label: "WiFi", icon: Wifi },
    { value: "ac", label: "AC", icon: Wind },
    { value: "tv", label: "TV", icon: Tv },
    { value: "usb", label: "USB", icon: Usb },
    { value: "reclining_seats", label: "Reclining Seats", icon: Armchair },
  ];

  const busTypes = [
    { value: "standard", label: "Standard" },
    { value: "luxury", label: "Luxury" },
    { value: "minibus", label: "Minibus" },
  ];

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        if (userData.role !== "carrier") {
          navigate("/");
          return;
        }

        setUser(userData);
        fetchBuses(userData.token);

        const freshData = await refreshUserData();
        if (freshData) {
          if (freshData.role !== "carrier") {
            navigate("/");
            return;
          }
          setUser(freshData);
        }
      } else {
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  const fetchBuses = async (token) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/buses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBuses(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch buses");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        busName: bus.busName,
        numberPlate: bus.numberPlate,
        capacity: bus.capacity,
        busType: bus.busType,
        amenities: bus.amenities || [],
      });
    } else {
      setEditingBus(null);
      setFormData({
        busName: "",
        numberPlate: "",
        capacity: 40,
        busType: "standard",
        amenities: [],
      });
    }
    setIsModalOpen(true);
    setError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBus(null);
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingBus) {
        await axios.put(`/api/buses/${editingBus._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await axios.post("/api/buses", formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }

      fetchBuses(user.token);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save bus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (busId) => {
    try {
      await axios.delete(`/api/buses/${busId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchBuses(user.token);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete bus");
    }
  };

  const getAmenityIcon = (amenity) => {
    const option = amenityOptions.find((a) => a.value === amenity);
    if (option) {
      const Icon = option.icon;
      return <Icon className="w-4 h-4" />;
    }
    return null;
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
            onClick={() => navigate("/")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Bus className="w-8 h-8 text-[#096B8A]" />
                <h1 className="text-2xl font-semibold text-[#064d63]">My Buses</h1>
              </div>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Bus
              </button>
            </div>

            {error && !isModalOpen && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading buses...</p>
              </div>
            ) : buses.length === 0 ? (
              <div className="text-center py-12">
                <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No buses yet</h3>
                <p className="text-gray-500 mb-4">Add your first bus to get started</p>
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Bus
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buses.map((bus) => (
                  <div
                    key={bus._id}
                    className={`border rounded-lg p-4 ${
                      bus.isActive ? "border-gray-200" : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-[#064d63]">{bus.busName}</h3>
                        <p className="text-sm text-gray-500">{bus.numberPlate}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal(bus)}
                          className="p-2 text-gray-500 hover:text-[#096B8A] hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(bus._id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{bus.capacity} seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bus.busType === "luxury"
                              ? "bg-yellow-100 text-yellow-800"
                              : bus.busType === "minibus"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {bus.busType.charAt(0).toUpperCase() + bus.busType.slice(1)}
                        </span>
                        {!bus.isActive && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      {bus.amenities && bus.amenities.length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-2">
                          {bus.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="flex items-center gap-1 px-2 py-1 bg-[#CDEEF2] text-[#096B8A] rounded-full text-xs"
                            >
                              {getAmenityIcon(amenity)}
                              {amenityOptions.find((a) => a.value === amenity)?.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#064d63]">
                {editingBus ? "Edit Bus" : "Add New Bus"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="busName"
                    value={formData.busName}
                    onChange={handleInputChange}
                    placeholder="e.g., Express 101"
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number Plate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="numberPlate"
                    value={formData.numberPlate}
                    onChange={handleInputChange}
                    placeholder="e.g., AA1234BB"
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A] uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Type
                  </label>
                  <select
                    name="busType"
                    value={formData.busType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                  >
                    {busTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => {
                      const Icon = amenity.icon;
                      const isSelected = formData.amenities.includes(amenity.value);
                      return (
                        <button
                          key={amenity.value}
                          type="button"
                          onClick={() => toggleAmenity(amenity.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                            isSelected
                              ? "bg-[#096B8A] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors font-medium disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : editingBus ? "Save Changes" : "Add Bus"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-semibold text-[#064d63] mb-4">Delete Bus?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this bus? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
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

export default MyBusesPage;
