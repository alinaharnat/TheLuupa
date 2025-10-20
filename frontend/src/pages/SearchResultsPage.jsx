import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bus, Clock, Users as UsersIcon } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  const passengers = parseInt(searchParams.get("passengers")) || 1;

  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { data } = await axios.post("/api/search", {
          from,
          to,
          date,
          passengers,
        });

        setTrips(data.trips);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to search trips. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (from && to && date) {
      fetchTrips();
    } else {
      setError("Missing search parameters");
      setIsLoading(false);
    }
  }, [from, to, date, passengers]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (departure, arrival) => {
    const diff = new Date(arrival) - new Date(departure);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow bg-[#CDEEF2] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-semibold text-[#064d63] mb-2">
              Search Results
            </h1>
            <p className="text-gray-600">
              {from} → {to} • {new Date(date).toLocaleDateString("en-GB")} •{" "}
              {passengers} passenger{passengers > 1 ? "s" : ""}
            </p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Searching for trips...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
              >
                Try New Search
              </button>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">
                No trips found for your search criteria
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
              >
                Try New Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <div
                  key={trip.scheduleId}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Bus className="w-5 h-5 text-[#096B8A]" />
                        <span className="font-semibold text-gray-800">
                          {trip.busNumber}
                        </span>
                        <span className="text-sm text-gray-500">
                          by {trip.carrier}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 mb-3">
                        <div>
                          <p className="text-2xl font-bold text-[#064d63]">
                            {formatTime(trip.departureTime)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trip.route.from}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                          <Clock className="w-4 h-4 text-gray-400 mb-1" />
                          <div className="w-full h-px bg-gray-300 relative">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                              {formatDuration(
                                trip.departureTime,
                                trip.arrivalTime
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-2xl font-bold text-[#064d63]">
                            {formatTime(trip.arrivalTime)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {trip.route.to}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <UsersIcon className="w-4 h-4" />
                          <span>
                            {trip.availableSeats} of {trip.totalSeats} seats
                            available
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-3xl font-bold text-[#064d63]">
                        ${trip.price}
                      </p>
                      <p className="text-sm text-gray-500">per seat</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;
