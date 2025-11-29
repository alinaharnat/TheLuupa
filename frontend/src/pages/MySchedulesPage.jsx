import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Clock,
  MapPin,
  Bus,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const MySchedulesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    busId: "",
    routeId: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    price: 0,
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
        fetchSchedules(userData.token);
        fetchBuses(userData.token);
        fetchRoutes(userData.token);

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

  const fetchSchedules = async (token) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/carrier-schedules", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuses = async (token) => {
    try {
      const { data } = await axios.get("/api/buses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBuses(data);
    } catch (err) {
      console.error("Failed to fetch buses:", err);
    }
  };

  const fetchRoutes = async (token) => {
    try {
      const { data } = await axios.get("/api/carrier-routes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoutes(data);
    } catch (err) {
      console.error("Failed to fetch routes:", err);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTravelDuration = (departureTime, arrivalTime) => {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const diffMs = arrival - departure;
    const diffHours = diffMs / (1000 * 60 * 60);
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);

    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const formatTimeForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
  };

  const openModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        busId: schedule.busId._id,
        routeId: schedule.routeId._id,
        departureDate: formatDateForInput(schedule.departureTime),
        departureTime: formatTimeForInput(schedule.departureTime),
        arrivalDate: formatDateForInput(schedule.arrivalTime),
        arrivalTime: formatTimeForInput(schedule.arrivalTime),
        price: schedule.price,
      });
    } else {
      setEditingSchedule(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        busId: "",
        routeId: "",
        departureDate: tomorrow.toISOString().split("T")[0],
        departureTime: "08:00",
        arrivalDate: tomorrow.toISOString().split("T")[0],
        arrivalTime: "14:00",
        price: 0,
      });
    }
    setIsModalOpen(true);
    setError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setError("");
  };

  // Calculate arrival time based on route distance and average speed
  const calculateArrivalTime = (departureDate, departureTime, routeId) => {
    const route = routes.find(r => r._id === routeId);
    if (!route || !departureDate || !departureTime) return { arrivalDate: "", arrivalTime: "" };

    const avgSpeed = 75; // km/h average bus speed
    const travelHours = route.distance / avgSpeed;

    const departure = new Date(`${departureDate}T${departureTime}`);
    const arrival = new Date(departure.getTime() + travelHours * 60 * 60 * 1000);

    return {
      arrivalDate: arrival.toISOString().split("T")[0],
      arrivalTime: arrival.toTimeString().slice(0, 5),
    };
  };

  // Calculate price based on bus type and route distance
  const calculatePrice = (busId, routeId) => {
    const bus = buses.find(b => b._id === busId);
    const route = routes.find(r => r._id === routeId);
    if (!bus || !route) return 0;

    // Price per km based on bus type
    const pricePerKm = {
      standard: 0.05,
      luxury: 0.08,
      minibus: 0.04,
    };

    const rate = pricePerKm[bus.busType] || 0.05;
    const price = route.distance * rate;

    return Math.round(price); // Round to whole number
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-calculate arrival time when route or departure changes
      if (name === "routeId" || name === "departureDate" || name === "departureTime") {
        const routeId = name === "routeId" ? value : prev.routeId;
        const depDate = name === "departureDate" ? value : prev.departureDate;
        const depTime = name === "departureTime" ? value : prev.departureTime;

        if (routeId && depDate && depTime) {
          const { arrivalDate, arrivalTime } = calculateArrivalTime(depDate, depTime, routeId);
          newData.arrivalDate = arrivalDate;
          newData.arrivalTime = arrivalTime;
        }
      }

      // Auto-calculate price when bus or route changes
      if (name === "busId" || name === "routeId") {
        const busId = name === "busId" ? value : prev.busId;
        const routeId = name === "routeId" ? value : prev.routeId;

        if (busId && routeId) {
          newData.price = calculatePrice(busId, routeId);
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const departureTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
    const arrivalTime = new Date(`${formData.arrivalDate}T${formData.arrivalTime}`);

    if (arrivalTime <= departureTime) {
      setError("Arrival time must be after departure time");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        busId: formData.busId,
        routeId: formData.routeId,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        price: Number(formData.price),
      };

      if (editingSchedule) {
        await axios.put(`/api/carrier-schedules/${editingSchedule._id}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await axios.post("/api/carrier-schedules", payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }

      fetchSchedules(user.token);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      await axios.delete(`/api/carrier-schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchSchedules(user.token);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete schedule");
    }
  };

  const getRouteDisplay = (route, full = false) => {
    if (!route || !route.cityId || route.cityId.length === 0) return "Unknown";
    const from = route.cityId[0]?.name || "?";
    const to = route.cityId[route.cityId.length - 1]?.name || "?";

    if (full && route.cityId.length > 2) {
      const stops = route.cityId.slice(1, -1).map(c => c.name).join(", ");
      return `${from} → ${to} (via ${stops})`;
    }

    if (route.cityId.length > 2) {
      return `${from} → ${to} (+${route.cityId.length - 2} stops)`;
    }

    return `${from} → ${to}`;
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
                <Calendar className="w-8 h-8 text-[#096B8A]" />
                <h1 className="text-2xl font-semibold text-[#064d63]">My Schedules</h1>
              </div>
              <button
                onClick={() => openModal()}
                disabled={buses.length === 0 || routes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Add Schedule
              </button>
            </div>

            {(buses.length === 0 || routes.length === 0) && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md">
                {buses.length === 0 && routes.length === 0
                  ? "You need to add buses and routes before creating schedules."
                  : buses.length === 0
                  ? "You need to add buses before creating schedules."
                  : "You need to add routes before creating schedules."}
              </div>
            )}

            {error && !isModalOpen && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No schedules yet</h3>
                <p className="text-gray-500 mb-4">Add your first schedule to get started</p>
                {buses.length > 0 && routes.length > 0 && (
                  <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Schedule
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className="border rounded-lg p-4 border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-[#064d63] font-semibold">
                          <MapPin className="w-4 h-4" />
                          {getRouteDisplay(schedule.routeId)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                          <Bus className="w-4 h-4" />
                          {schedule.busId?.busName} ({schedule.busId?.numberPlate})
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal(schedule)}
                          className="p-2 text-gray-500 hover:text-[#096B8A] hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(schedule._id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(schedule.departureTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span>{formatDateTime(schedule.arrivalTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {getTravelDuration(schedule.departureTime, schedule.arrivalTime)} in transit
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-600">${schedule.price}</span>
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
                {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
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
                    Bus <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="busId"
                    value={formData.busId}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                    required
                  >
                    <option value="">Select bus</option>
                    {buses.map((bus) => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busName} ({bus.numberPlate}) - {bus.busType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                    required
                  >
                    <option value="">Select route</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {getRouteDisplay(route, true)} ({route.distance} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="departureDate"
                      value={formData.departureDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="departureTime"
                      value={formData.departureTime}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Arrival
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="date"
                      value={formData.arrivalDate}
                      className="flex-1 border border-gray-200 rounded-md p-2.5 bg-gray-50 text-gray-600"
                      readOnly
                    />
                    <input
                      type="time"
                      value={formData.arrivalTime}
                      className="flex-1 border border-gray-200 rounded-md p-2.5 bg-gray-50 text-gray-600"
                      readOnly
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-calculated based on route distance (~75 km/h avg speed)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    className="w-full border border-gray-200 rounded-md p-2.5 bg-gray-50 text-gray-600"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-calculated: Standard $0.05/km, Luxury $0.08/km, Minibus $0.04/km
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
                  {isSubmitting ? "Saving..." : editingSchedule ? "Save Changes" : "Add Schedule"}
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
            <h2 className="text-xl font-semibold text-[#064d63] mb-4">Delete Schedule?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this schedule? This action cannot be undone.
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

export default MySchedulesPage;
