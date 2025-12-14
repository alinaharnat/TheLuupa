import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bus, Clock, Users as UsersIcon, SlidersHorizontal } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 150]);
  const [sortBy, setSortBy] = useState("departure");

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
    const date = new Date(dateString);
    // Use UTC methods to display time exactly as stored in database
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const formatDuration = (departure, arrival) => {
    const diff = new Date(arrival) - new Date(departure);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getTimeCategory = (dateString) => {
    const hour = new Date(dateString).getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  };

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...trips];

    // Filter by time
    if (timeFilter !== "all") {
      filtered = filtered.filter(
        (trip) => getTimeCategory(trip.departureTime) === timeFilter
      );
    }

    // Filter by price
    filtered = filtered.filter(
      (trip) => trip.price >= priceRange[0] && trip.price <= priceRange[1]
    );

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "departure") {
        return new Date(a.departureTime) - new Date(b.departureTime);
      } else if (sortBy === "price-low") {
        return a.price - b.price;
      } else if (sortBy === "price-high") {
        return b.price - a.price;
      }
      return 0;
    });

    return filtered;
  }, [trips, timeFilter, priceRange, sortBy]);

  // Get price range from trips
  const maxPrice = useMemo(() => {
    if (trips.length === 0) return 150;
    return Math.max(...trips.map((t) => t.price));
  }, [trips]);

  useEffect(() => {
    if (trips.length > 0) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice, trips.length]);

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
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-semibold text-[#064d63]">
                Search Results
              </h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-[#096B8A] hover:bg-[#CDEEF2] rounded-md transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </span>
              </button>
            </div>
            <p className="text-gray-600">
              {from} → {to} • {(() => {
                const [year, month, day] = date.split('-');
                return new Date(year, month - 1, day).toLocaleDateString("en-GB");
              })()} •{" "}
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              {showFilters && (
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                    <h2 className="text-lg font-semibold text-[#064d63] mb-4">
                      Filters
                    </h2>

                    {/* Sort By */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#096B8A] focus:border-transparent text-sm"
                      >
                        <option value="departure">Departure Time</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </div>

                    {/* Departure Time */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Departure Time
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="timeFilter"
                            value="all"
                            checked={timeFilter === "all"}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="mr-2 text-[#096B8A] focus:ring-[#096B8A]"
                          />
                          <span className="text-sm text-gray-700">All Times</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="timeFilter"
                            value="morning"
                            checked={timeFilter === "morning"}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="mr-2 text-[#096B8A] focus:ring-[#096B8A]"
                          />
                          <span className="text-sm text-gray-700">Morning (6:00 - 12:00)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="timeFilter"
                            value="afternoon"
                            checked={timeFilter === "afternoon"}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="mr-2 text-[#096B8A] focus:ring-[#096B8A]"
                          />
                          <span className="text-sm text-gray-700">Afternoon (12:00 - 18:00)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="timeFilter"
                            value="evening"
                            checked={timeFilter === "evening"}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="mr-2 text-[#096B8A] focus:ring-[#096B8A]"
                          />
                          <span className="text-sm text-gray-700">Evening (18:00 - 22:00)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="timeFilter"
                            value="night"
                            checked={timeFilter === "night"}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="mr-2 text-[#096B8A] focus:ring-[#096B8A]"
                          />
                          <span className="text-sm text-gray-700">Night (22:00 - 6:00)</span>
                        </label>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#096B8A]"
                        />
                        <p className="text-xs text-gray-500 text-center">
                          Max: ${priceRange[1]}
                        </p>
                      </div>
                    </div>

                    {/* Reset Filters */}
                    <button
                      onClick={() => {
                        setTimeFilter("all");
                        setPriceRange([0, maxPrice]);
                        setSortBy("departure");
                      }}
                      className="w-full py-2 text-sm text-[#096B8A] hover:bg-[#CDEEF2] rounded-md transition-colors border border-[#096B8A]"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
                {filteredAndSortedTrips.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-600 mb-4">
                      No trips match your filters. Try adjusting your criteria.
                    </p>
                    <button
                      onClick={() => {
                        setTimeFilter("all");
                        setPriceRange([0, maxPrice]);
                      }}
                      className="px-6 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">
                        Showing {filteredAndSortedTrips.length} of {trips.length} trips
                      </p>
                    </div>
                    {filteredAndSortedTrips.map((trip) => (
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
                      <button
                        onClick={() => navigate(`/booking/${trip.scheduleId}?passengers=${passengers}`)}
                        className="mt-2 px-6 py-2 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors font-medium"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;
