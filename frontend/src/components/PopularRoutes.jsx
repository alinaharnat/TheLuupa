import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight, MapPin } from "lucide-react";

export default function PopularRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPopularRoutes = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/home/popular-routes?limit=10");
        setRoutes(data.routes || []);
      } catch (err) {
        console.error("Error fetching popular routes:", err);
        setError("Failed to load popular routes");
      } finally {
        setLoading(false);
      }
    };

    fetchPopularRoutes();
  }, []);

  const handleExplore = (route) => {
    // Navigate to search page with route details
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const searchParams = new URLSearchParams({
      from: route.from,
      to: route.to,
      date: dateString,
      passengers: "1"
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  // Generate a gradient color based on route name for placeholder
  const getRouteColor = (routeName) => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-orange-400 to-orange-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
      "from-red-400 to-red-600",
    ];
    const index = routeName.length % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#064d63] mb-8">
            Popular routes
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || routes.length === 0) {
    return null; // Don't show section if no routes
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#064d63] mb-8">
          Popular routes
        </h2>
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {routes.map((route) => (
              <div
                key={route.routeId}
                className="flex-shrink-0 w-64 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Placeholder image with gradient */}
                <div
                  className={`h-48 bg-gradient-to-br ${getRouteColor(route.from + route.to)} flex items-center justify-center`}
                >
                  <MapPin size={48} className="text-white opacity-50" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-[#064d63] mb-2">
                    {route.from} {route.to}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {route.bookingCount} {route.bookingCount === 1 ? 'booking' : 'bookings'}
                  </p>
                  <button
                    onClick={() => handleExplore(route)}
                    className="w-full bg-[#096B8A] hover:bg-[#07576f] text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    Explore
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

