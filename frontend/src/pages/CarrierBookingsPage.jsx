import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ticket,
  MapPin,
  Bus,
  Clock,
  User,
  Mail,
  Filter,
  Search,
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const CarrierBookingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
        fetchBookings(userData.token);

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

  const fetchBookings = async (token) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/carrier-schedules/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(data);
      setFilteredBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = bookings;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.passenger.name.toLowerCase().includes(query) ||
          b.passenger.email.toLowerCase().includes(query) ||
          b.bus.numberPlate.toLowerCase().includes(query) ||
          b.route?.from.toLowerCase().includes(query) ||
          b.route?.to.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(result);
  }, [statusFilter, searchQuery, bookings]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const stats = {
    total: bookings.length,
    confirmed: confirmedBookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    confirmedSeats: confirmedBookings.reduce((sum, b) => sum + b.seatsCount, 0),
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
                <Ticket className="w-8 h-8 text-[#096B8A]" />
                <h1 className="text-2xl font-semibold text-[#064d63]">Bookings</h1>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#064d63]">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                <p className="text-xs text-gray-500">Confirmed</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-xs text-gray-500">Cancelled</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.confirmedSeats}</p>
                <p className="text-xs text-gray-500">Seats Booked</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by passenger, bus, or route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No bookings found</h3>
                <p className="text-gray-500">
                  {bookings.length === 0
                    ? "You don't have any bookings yet"
                    : "No bookings match your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="border rounded-lg p-4 border-gray-200 hover:border-[#096B8A] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Route & Bus Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-[#064d63] font-semibold mb-2">
                          <MapPin className="w-4 h-4" />
                          {booking.route
                            ? `${booking.route.from} → ${booking.route.to}`
                            : "Unknown route"}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Bus className="w-4 h-4" />
                            {booking.bus.name} ({booking.bus.numberPlate})
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDateTime(booking.schedule.departureTime)}
                          </div>
                        </div>
                      </div>

                      {/* Passenger Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-700 mb-1">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{booking.passenger.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4" />
                          {booking.passenger.email}
                        </div>
                      </div>

                      {/* Seats & Status */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#064d63]">
                            {booking.seatsCount}
                          </p>
                          <p className="text-xs text-gray-500">
                            Seat{booking.seatsCount !== 1 ? "s" : ""}: {booking.seats.join(", ")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            ${booking.schedule.price * booking.seatsCount}
                          </p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                        {booking.isSurprise && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Surprise
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CarrierBookingsPage;
