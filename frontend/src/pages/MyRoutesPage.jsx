import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Route,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  MapPin,
  ArrowRight,
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const MyRoutesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    cityIds: ["", ""],
  });

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
        fetchRoutes(userData.token);
        fetchCities();

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

  const fetchRoutes = async (token) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/carrier-routes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutes(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch routes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data } = await axios.get("/api/cities");
      setCities(data);
    } catch (err) {
      console.error("Failed to fetch cities:", err);
    }
  };

  const openModal = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        cityIds: route.cityId.map((c) => c._id),
      });
    } else {
      setEditingRoute(null);
      setFormData({
        cityIds: ["", ""],
      });
    }
    setIsModalOpen(true);
    setError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
    setError("");
  };

  const handleCityChange = (index, value) => {
    setFormData((prev) => {
      const newCityIds = [...prev.cityIds];
      newCityIds[index] = value;
      return { ...prev, cityIds: newCityIds };
    });
  };

  const addCity = () => {
    setFormData((prev) => ({
      ...prev,
      cityIds: [...prev.cityIds, ""],
    }));
  };

  const removeCity = (index) => {
    if (formData.cityIds.length <= 2) return;
    setFormData((prev) => ({
      ...prev,
      cityIds: prev.cityIds.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const validCityIds = formData.cityIds.filter((id) => id);
    if (validCityIds.length < 2) {
      setError("Route must have at least 2 cities");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingRoute) {
        await axios.put(
          `/api/carrier-routes/${editingRoute._id}`,
          { cityIds: validCityIds },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      } else {
        await axios.post(
          "/api/carrier-routes",
          { cityIds: validCityIds },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }

      fetchRoutes(user.token);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (routeId) => {
    try {
      await axios.delete(`/api/carrier-routes/${routeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchRoutes(user.token);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete route");
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
            onClick={() => navigate("/")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Route className="w-8 h-8 text-[#096B8A]" />
                <h1 className="text-2xl font-semibold text-[#064d63]">My Routes</h1>
              </div>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-4 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Route
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
                <p className="mt-4 text-gray-600">Loading routes...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12">
                <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No routes yet</h3>
                <p className="text-gray-500 mb-4">Add your first route to get started</p>
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Route
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => (
                  <div
                    key={route._id}
                    className="border rounded-lg p-4 border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-[#064d63] font-semibold">
                          <MapPin className="w-4 h-4" />
                          {route.cityId[0]?.name || "Unknown"}
                        </div>
                        {route.cityId.length > 2 && (
                          <div className="ml-6 text-sm text-gray-500">
                            via {route.cityId.slice(1, -1).map((c) => c.name).join(", ")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[#064d63] font-semibold mt-1">
                          <ArrowRight className="w-4 h-4" />
                          {route.cityId[route.cityId.length - 1]?.name || "Unknown"}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal(route)}
                          className="p-2 text-gray-500 hover:text-[#096B8A] hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(route._id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">Distance:</span>
                        <span>{route.distance} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-medium">Stops:</span>
                        <span>{route.cityId.length} cities</span>
                      </div>
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
                {editingRoute ? "Edit Route" : "Add New Route"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cities <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {formData.cityIds.map((cityId, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#096B8A] text-white flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <select
                          value={cityId}
                          onChange={(e) => handleCityChange(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                          required
                        >
                          <option value="">Select city</option>
                          {cities.map((city) => (
                            <option key={city._id} value={city._id}>
                              {city.name} ({city.country})
                            </option>
                          ))}
                        </select>
                        {formData.cityIds.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeCity(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addCity}
                    className="mt-2 flex items-center gap-1 text-sm text-[#096B8A] hover:text-[#064d63] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add stop
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Distance will be calculated automatically based on city coordinates
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors font-medium disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : editingRoute ? "Save Changes" : "Add Route"}
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
            <h2 className="text-xl font-semibold text-[#064d63] mb-4">Delete Route?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this route? This action cannot be undone.
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

export default MyRoutesPage;
