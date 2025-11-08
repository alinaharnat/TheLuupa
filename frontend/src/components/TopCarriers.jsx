import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, Bus } from "lucide-react";

export default function TopCarriers() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopCarriers = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/home/top-carriers?limit=10");
        setCarriers(data.carriers || []);
      } catch (err) {
        console.error("Error fetching top carriers:", err);
        setError("Failed to load top carriers");
      } finally {
        setLoading(false);
      }
    };

    fetchTopCarriers();
  }, []);

  // Generate a gradient color based on carrier name for placeholder
  const getCarrierColor = (carrierName) => {
    const colors = [
      "from-blue-500 to-blue-700",
      "from-indigo-500 to-indigo-700",
      "from-purple-500 to-purple-700",
      "from-green-500 to-green-700",
      "from-teal-500 to-teal-700",
      "from-cyan-500 to-cyan-700",
      "from-orange-500 to-orange-700",
      "from-red-500 to-red-700",
    ];
    const index = carrierName.length % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#064d63] mb-8">
            Top carriers
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
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

  if (error || carriers.length === 0) {
    return null; // Don't show section if no carriers
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#064d63] mb-8">
          Top carriers
        </h2>
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {carriers.map((carrier) => (
              <div
                key={carrier.carrierId}
                className="flex-shrink-0 w-64 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Placeholder image with gradient */}
                <div
                  className={`h-48 bg-gradient-to-br ${getCarrierColor(carrier.name)} flex items-center justify-center`}
                >
                  <Bus size={48} className="text-white opacity-50" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={18} className="text-[#096B8A]" />
                    <h3 className="text-xl font-semibold text-[#064d63]">
                      {carrier.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {carrier.routeCount} {carrier.routeCount === 1 ? 'route' : 'routes'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

