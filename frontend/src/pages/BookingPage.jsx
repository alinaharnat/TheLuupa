import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bus, Clock, MapPin, CreditCard, User } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BookingPage = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const passengers = parseInt(searchParams.get("passengers")) || 1;

  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [tripDetails, setTripDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  useEffect(() => {
    const fetchSeats = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { data } = await axios.get(`/api/bookings/schedule/${scheduleId}/seats`);
        setSeats(data.seats);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load seats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeats();
  }, [scheduleId]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const { data } = await axios.get(`/api/bookings/schedule/${scheduleId}`);
        setTripDetails(data);
      } catch (err) {
        console.error("Failed to fetch trip details:", err);
      }
    };

    fetchTripDetails();
  }, [scheduleId]);

  const toggleSeat = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length < passengers) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      }
    }
  };

  const handleBooking = async () => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      navigate("/auth");
      return;
    }

    const token = JSON.parse(userInfo).token;
    if (!token) {
      navigate("/auth");
      return;
    }

    if (selectedSeats.length !== passengers) {
      setError(`Please select exactly ${passengers} seat(s)`);
      return;
    }

    setIsBooking(true);
    setError("");

    try {
      const { data } = await axios.post(
        "/api/bookings",
        {
          scheduleId,
          seatNumbers: selectedSeats,
          paymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/my-tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPrice = tripDetails ? tripDetails.price * selectedSeats.length : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow bg-[#CDEEF2] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Results</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Details Card */}
              {tripDetails && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-[#064d63] mb-4">
                    Trip Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Bus className="w-5 h-5 text-[#096B8A]" />
                      <span className="font-medium">{tripDetails.busNumber}</span>
                      <span className="text-sm text-gray-500">
                        by {tripDetails.carrier}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#096B8A]" />
                      <span>
                        {tripDetails.route.from} → {tripDetails.route.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#096B8A]" />
                      <span>
                        Departure: {formatTime(tripDetails.departureTime)} |
                        Arrival: {formatTime(tripDetails.arrivalTime)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Seat Selection Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-[#064d63] mb-4">
                  Select Seats ({selectedSeats.length}/{passengers})
                </h2>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading seats...</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-500 rounded"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#096B8A] rounded"></div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-400 rounded"></div>
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>

                    {/* Bus Layout */}
                    <div className="max-w-xl mx-auto bg-gray-100 rounded-lg p-6">
                      {/* Driver area */}
                      <div className="flex items-center justify-center mb-4 pb-4 border-b-2 border-gray-300">
                        <div className="bg-gray-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                          🚗 Driver
                        </div>
                      </div>

                      <div className="text-center mb-4 text-sm font-medium text-gray-600">
                        Front of Bus
                      </div>

                      {/* Seats with aisle */}
                      <div className="space-y-3">
                        {Array.from({ length: 10 }, (_, rowIndex) => {
                          const row = rowIndex + 1;
                          const leftSeats = [row * 4 - 3, row * 4 - 2]; // seats 1-2, 5-6, 9-10, etc.
                          const rightSeats = [row * 4 - 1, row * 4]; // seats 3-4, 7-8, 11-12, etc.

                          return (
                            <div key={row} className="flex items-center gap-2">
                              {/* Row number */}
                              <div className="w-8 text-center text-xs font-semibold text-gray-500">
                                {row}
                              </div>

                              {/* Left side seats (2 seats) */}
                              <div className="flex gap-2 flex-1">
                                {leftSeats.map((seatNum) => {
                                  const seat = seats.find(s => s.seatNumber === seatNum);
                                  if (!seat) return null;

                                  const isSelected = selectedSeats.includes(seat.seatNumber);
                                  const isAvailable = seat.isAvailable;

                                  return (
                                    <button
                                      key={seat._id}
                                      onClick={() => isAvailable && toggleSeat(seat.seatNumber)}
                                      disabled={!isAvailable}
                                      className={`
                                        flex-1 h-12 rounded-lg flex items-center justify-center font-semibold text-sm transition-all shadow-sm
                                        ${isSelected ? "bg-[#096B8A] text-white scale-105 shadow-lg" : ""}
                                        ${!isSelected && isAvailable ? "bg-green-500 text-white hover:bg-green-600 hover:scale-105" : ""}
                                        ${!isAvailable ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-60" : ""}
                                      `}
                                    >
                                      {seat.seatNumber}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Aisle */}
                              <div className="w-8 flex items-center justify-center">
                                <div className="w-1 h-8 bg-gray-300 rounded-full"></div>
                              </div>

                              {/* Right side seats (2 seats) */}
                              <div className="flex gap-2 flex-1">
                                {rightSeats.map((seatNum) => {
                                  const seat = seats.find(s => s.seatNumber === seatNum);
                                  if (!seat) return null;

                                  const isSelected = selectedSeats.includes(seat.seatNumber);
                                  const isAvailable = seat.isAvailable;

                                  return (
                                    <button
                                      key={seat._id}
                                      onClick={() => isAvailable && toggleSeat(seat.seatNumber)}
                                      disabled={!isAvailable}
                                      className={`
                                        flex-1 h-12 rounded-lg flex items-center justify-center font-semibold text-sm transition-all shadow-sm
                                        ${isSelected ? "bg-[#096B8A] text-white scale-105 shadow-lg" : ""}
                                        ${!isSelected && isAvailable ? "bg-green-500 text-white hover:bg-green-600 hover:scale-105" : ""}
                                        ${!isAvailable ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-60" : ""}
                                      `}
                                    >
                                      {seat.seatNumber}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Back of bus label */}
                      <div className="text-center mt-6 pt-4 border-t-2 border-gray-300 text-sm font-medium text-gray-600">
                        Back of Bus
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Summary Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-[#064d63] mb-4">
                  Booking Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Passengers:</span>
                    <span className="font-medium">{passengers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selected Seats:</span>
                    <span className="font-medium">
                      {selectedSeats.length > 0 ? selectedSeats.join(", ") : "-"}
                    </span>
                  </div>
                  {tripDetails && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price per seat:</span>
                        <span className="font-medium">${tripDetails.price}</span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-[#064d63]">
                            ${totalPrice}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#096B8A] focus:border-transparent"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="apple_pay">Apple Pay</option>
                  </select>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={isBooking || selectedSeats.length !== passengers}
                  className="w-full py-3 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isBooking ? "Processing..." : "Confirm Booking"}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You can cancel up to 2 hours before departure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPage;
