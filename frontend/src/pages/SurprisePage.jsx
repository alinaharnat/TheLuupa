import React, { useState, useEffect, forwardRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/datepicker.css";

import {
  Sparkles,
  Calendar,
  Users,
  ArrowRightCircle,
  MapPin,
  DollarSign,
  Globe2,
  Sun,
  CloudSun,
  Sunset,
  Moon,
} from "lucide-react";

export default function SurprisePage() {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);

  const [filteredCities, setFilteredCities] = useState([]);

  // FORM FIELDS
  const [from, setFrom] = useState("");
  const [selectedCity, setSelectedCity] = useState("");  // confirmed city selection
  const [country, setCountry] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [timeOfDay, setTimeOfDay] = useState("any");
  const [date, setDate] = useState(null);
  const today = new Date();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Load cities + countries + price bounds
  useEffect(() => {
    async function loadAll() {
      try {
        const [cityRes, countryRes, priceRes] = await Promise.all([
          axios.get("/api/cities"),
          axios.get("/api/countries"),
          axios.get("/api/surprise/price-range"),
        ]);

        const formattedCities = cityRes.data.map((c) => ({
          name: c.name,
          country: c.country || "",
          label: c.country ? `${c.name}, ${c.country}` : c.name,  // Show country only if it exists
        }));

        setCities(formattedCities);
        setCountries(countryRes.data);
        setPriceBounds({
          min: priceRes.data.minPrice,
          max: priceRes.data.maxPrice,
        });
        setMaxPrice(priceRes.data.maxPrice);
      } catch (err) {
        console.error("Error loading data", err);
      }
    }

    loadAll();
  }, []);

  // ✅ handle autocomplete typing
  const handleCityInput = (value) => {
    setFrom(value);
    setSelectedCity(""); // user started typing, so remove confirmed city

    if (!value.trim()) {
      setFilteredCities([]);
      return;
    }

    const filtered = cities.filter((c) =>
      c.label.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredCities(filtered);

    // ✅ Auto-confirm if exact match
    const exactMatch = filtered.find(
      (c) => c.label.toLowerCase() === value.toLowerCase()
    );

    if (exactMatch) {
      setSelectedCity(exactMatch.label);
      setFilteredCities([]);
    }
  };

  // ✅ when user selects from dropdown
  const selectCity = (label) => {
    setFrom(label);
    setSelectedCity(label);
    setFilteredCities([]);
  };

  const toggleTimeSelection = (id) => {
    setTimeOfDay((prev) => (prev === id ? "any" : id));
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const finalCity = selectedCity || from;

    // Validation
    if (!finalCity || !finalCity.trim()) {
      setError("Departure city is required.");
      return;
    }

    if (!date) {
      setError("Departure date is required.");
      return;
    }

    // Check if date is in the past
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (date < todayStart) {
      setError("Date cannot be earlier than today.");
      return;
    }

    if (passengers < 1 || passengers > 50) {
      setError("Number of passengers must be between 1 and 50.");
      return;
    }

    setError("");
    setLoading(true);

    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    try {
      const response = await axios.post("/api/surprise", {
        from: finalCity,
        date: dateString,
        passengers,
        maxPrice,
        country,
        timeOfDay,
      });

      const trip = response.data.trip;
      navigate(`/booking/${trip.scheduleId}?passengers=${passengers}&surprise=true`);
    } catch (err) {
      setError(err.response?.data?.message || "Surprise trip not found.");
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [
    { id: "morning", label: "Morning", icon: <Sun size={18} /> },
    { id: "afternoon", label: "Afternoon", icon: <CloudSun size={18} /> },
    { id: "evening", label: "Evening", icon: <Sunset size={18} /> },
    { id: "night", label: "Night", icon: <Moon size={18} /> },
  ];

  // Custom input component for date picker
  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <div className="flex items-center w-full p-3 border rounded-lg text-gray-700 bg-white focus-within:ring-2 focus-within:ring-[#096B8A] cursor-pointer">
      <input
        type="text"
        value={value}
        ref={ref}
        placeholder="Select departure date"
        readOnly
        className="flex-1 outline-none cursor-pointer"
        onClick={onClick}
      />
      <Calendar
        size={18}
        className="ml-2 text-gray-600"
        onClick={onClick}
      />
    </div>
  ));
  CustomDateInput.displayName = "CustomDateInput";

  return (
    <div className="flex flex-col min-h-screen bg-[#CDEEF2]">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-6 py-10">
        <div className="bg-white w-full max-w-2xl shadow-2xl rounded-3xl p-10 relative">

          <div className="flex justify-center mb-4">
            <Sparkles size={48} className="text-[#096B8A]" />
          </div>

          <h1 className="text-3xl font-semibold text-center text-[#064d63]">
            Surprise Trip 🎁
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Let us pick a random destination for you ✨
          </p>

          <form onSubmit={handleSearch} className="space-y-6 mt-8">

            {/* Departure city */}
            <div className="relative">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <MapPin /> Departure city (required)
              </label>

              <input
                type="text"
                className="w-full p-3 border rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-[#096B8A]"
                placeholder="Start typing city..."
                value={from}
                onChange={(e) => handleCityInput(e.target.value)}
              />

              {/* Autocomplete dropdown */}
              {filteredCities.length > 0 && (
                <ul className="absolute w-full bg-white border rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto mt-1">
                  {filteredCities.map((c, index) => (
                    <li
                      key={index}
                      onClick={() => selectCity(c.label)}
                      className="px-4 py-2 cursor-pointer hover:bg-[#096B8A] hover:text-white"
                    >
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Departure date */}
            <div>
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Calendar /> Departure date (required)
              </label>
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                minDate={today}
                dateFormat="dd.MM.yyyy"
                customInput={<CustomDateInput />}
                calendarClassName="custom-calendar"
                placeholderText="Select departure date"
              />
            </div>

            {/* Country */}
            <div>
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Globe2 /> Country to visit (optional)
              </label>

              <select
                className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-[#096B8A]"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Any country</option>
                {countries.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price slider */}
            <div>
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <DollarSign /> Max ticket price
              </label>

              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full cursor-pointer"
              />

              <p className="text-center text-gray-600 mt-1">
                ${maxPrice} (range: {priceBounds.min}–{priceBounds.max})
              </p>
            </div>

            {/* Time of day */}
            <div>
              <label className="font-medium text-gray-700 mb-2 block">
                Preferred departure time (optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleTimeSelection(opt.id)}
                    className={`py-2 px-3 rounded-lg border text-sm flex items-center gap-2 justify-center transition
                      ${
                        timeOfDay === opt.id
                          ? "bg-[#096B8A] text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Users /> Passengers (required)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-[#096B8A]"
              />
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#096B8A] text-white rounded-lg hover:bg-[#07576f] transition font-medium disabled:opacity-60"
            >
              {loading ? "Searching..." : "Find Surprise Trip"}
              <ArrowRightCircle size={18} />
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
