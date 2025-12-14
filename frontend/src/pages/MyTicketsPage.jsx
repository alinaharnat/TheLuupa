import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Ticket,
  Bus,
  Clock,
  MapPin,
  CreditCard,
  Calendar,
  Users,
  XCircle,
  User,
  Eye,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [revealingId, setRevealingId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    // Check for payment verification
    const sessionId = searchParams.get("session_id");
    const paymentCancelled = searchParams.get("payment_cancelled");

    if (sessionId) {
      verifyPayment(sessionId);
    } else if (paymentCancelled) {
      setPaymentMessage("Payment was cancelled.");
      // Clear URL params
      setSearchParams({});
    }

    fetchBookings();
  }, []);

  const verifyPayment = async (sessionId) => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return;

    const token = JSON.parse(userInfo).token;
    if (!token) return;

    try {
      const { data } = await axios.post(
        "/api/payments/verify",
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.status === "confirmed" || data.status === "already_confirmed") {
        setPaymentMessage("Payment successful! Your booking is confirmed.");
      } else if (data.status === "expired") {
        setPaymentMessage("Payment session expired. Please try again.");
      }

      // Clear URL params
      setSearchParams({});

      // Refresh bookings
      fetchBookings();
    } catch (err) {
      console.error("Payment verification error:", err);
    }
  };

  const fetchBookings = async () => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    let token;
    try {
      const parsed = JSON.parse(userInfo);
      token = parsed.token;
    } catch (e) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(true);
    setError("");

    try {
      const { data } = await axios.get("/api/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(data.bookings);
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
      } else {
        setError(err.response?.data?.message || "Failed to load bookings");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return;

    const token = JSON.parse(userInfo).token;
    if (!token) return;

    setCancellingId(bookingId);

    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const [payingId, setPayingId] = useState(null);

  const handlePayNow = async (bookingId) => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return;

    const token = JSON.parse(userInfo).token;
    if (!token) return;

    setPayingId(bookingId);

    try {
      const { data } = await axios.post(
        "/api/payments/create-session",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create payment session");
      setPayingId(null);
    }
  };

  const handleRevealDestination = async (bookingId) => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return;

    const token = JSON.parse(userInfo).token;
    if (!token) return;

    setRevealingId(bookingId);

    try {
      await axios.put(`/api/bookings/${bookingId}/reveal-destination`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reveal destination");
    } finally {
      setRevealingId(null);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    // Use UTC methods to display time exactly as stored in database
    return {
      date: date.toLocaleDateString("en-GB", { timeZone: "UTC" }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }),
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "successful":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      case "refunded":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const canCancelBooking = (booking) => {
    if (["cancelled", "failed", "completed", "expired"].includes(booking.status)) {
      return false;
    }
    const hoursUntilDeparture =
      (new Date(booking.trip.departureTime) - new Date()) / (1000 * 60 * 60);
    return hoursUntilDeparture >= 2;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow bg-[#CDEEF2] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3">
              <Ticket className="w-8 h-8 text-[#096B8A]" />
              <h1 className="text-2xl font-semibold text-[#064d63]">
                My Tickets
              </h1>
            </div>
          </div>

          {paymentMessage && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              paymentMessage.includes("successful") || paymentMessage.includes("confirmed")
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}>
              <CheckCircle className="w-5 h-5" />
              <span>{paymentMessage}</span>
              <button
                onClick={() => setPaymentMessage("")}
                className="ml-auto text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading your bookings...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="bg-[#CDEEF2] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-[#096B8A]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#064d63] mb-3">
                Sign In Required
              </h2>
              <p className="text-gray-600 mb-6">
                Please sign in to view your tickets and bookings
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-3 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-8 py-3 bg-white text-[#096B8A] border-2 border-[#096B8A] rounded-md hover:bg-[#CDEEF2] transition-colors font-medium"
                >
                  Register
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchBookings}
                className="px-6 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#064d63] mb-3">
                No Tickets Yet
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't booked any trips yet. Start exploring destinations!
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
              >
                Search for Trips
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const departure = formatDateTime(booking.trip.departureTime);
                const arrival = formatDateTime(booking.trip.arrivalTime);

                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </span>
                        {booking.status === "pending" && booking.expiresAt && (
                          <span className="text-xs text-orange-600 font-medium">
                            ⏱ Expires: {new Date(booking.expiresAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC"
                            })}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          Booked on {formatDateTime(booking.createdAt).date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handlePayNow(booking._id)}
                            disabled={payingId === booking._id}
                            className="flex items-center gap-1 px-3 py-1 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] text-sm font-medium disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4" />
                            {payingId === booking._id ? "Processing..." : "Pay Now"}
                          </button>
                        )}
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            disabled={cancellingId === booking._id}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            {cancellingId === booking._id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Trip Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-[#064d63] mb-3">
                          Trip Information
                        </h3>

                        <div className="flex items-center gap-3 text-sm">
                          <Bus className="w-5 h-5 text-[#096B8A]" />
                          <span className="font-medium">
                            {booking.trip.busNumber}
                          </span>
                        </div>

                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="w-5 h-5 text-[#096B8A] mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">
                              {booking.trip.from} → {booking.trip.to}
                            </p>
                            {booking.trip.distance !== null && booking.trip.distance !== undefined && (
                              <p className="text-gray-500">
                                {booking.trip.distance} km
                              </p>
                            )}
                            {booking.isSurprise && !booking.destinationRevealed && (
                              <div className="mt-2">
                                {booking.canRevealDestination ? (
                                  <button
                                    onClick={() => handleRevealDestination(booking._id)}
                                    disabled={revealingId === booking._id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors text-xs font-medium disabled:opacity-50"
                                  >
                                    <Eye className="w-3 h-3" />
                                    {revealingId === booking._id ? "Revealing..." : "Reveal Destination"}
                                  </button>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">
                                    Destination will be available 5 hours before departure
                                  </p>
                                )}
                              </div>
                            )}
                            {booking.isSurprise && (
                              <span className="inline-block mt-2 text-xs bg-[#096B8A] text-white px-2 py-1 rounded-full">
                                🎁 Surprise Trip
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-sm">
                          <Clock className="w-5 h-5 text-[#096B8A] mt-0.5" />
                          <div>
                            <p>
                              <span className="font-medium">Departure:</span>{" "}
                              {departure.date} at {departure.time}
                            </p>
                            <p>
                              <span className="font-medium">Arrival:</span>{" "}
                              {arrival.date} at {arrival.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <Users className="w-5 h-5 text-[#096B8A]" />
                          <span>
                            Seats: {booking.seats.join(", ")} (
                            {booking.seats.length} seat
                            {booking.seats.length > 1 ? "s" : ""})
                          </span>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-[#064d63] mb-3">
                          Payment Details
                        </h3>

                        {booking.payment ? (
                          <>
                            <div className="flex items-center gap-3 text-sm">
                              <CreditCard className="w-5 h-5 text-[#096B8A]" />
                              <span className="capitalize">
                                {booking.payment.method.replace("_", " ")}
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                              <span className="text-sm text-gray-600">
                                Total Amount:
                              </span>
                              <span className="text-2xl font-bold text-[#064d63]">
                                ${booking.payment.amount}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Payment Status:
                              </span>
                              <span
                                className={`font-medium capitalize ${getPaymentStatusColor(
                                  booking.payment.status
                                )}`}
                              >
                                {booking.payment.status}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No payment information available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyTicketsPage;
