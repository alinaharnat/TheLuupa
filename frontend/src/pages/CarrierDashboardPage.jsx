import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bus, Route, Calendar, Building2, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const CarrierDashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#064d63]">Carrier Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.name}</p>
          </div>

          {/* Company Info Card */}
          <Link
            to="/carrier/company"
            className="block bg-white rounded-lg shadow-md p-6 mb-8 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#096B8A] rounded-full">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#064d63]">{user.companyName}</h2>
                  <p className="text-gray-500">Carrier Account</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </Link>

          {/* Quick Actions */}
          <h2 className="text-xl font-semibold text-[#064d63] mb-4">Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              to="/carrier/buses"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#096B8A] rounded-full">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#064d63]">My Buses</h3>
                  <p className="text-gray-500 text-sm">Manage your fleet</p>
                </div>
              </div>
            </Link>

            <Link
              to="/carrier/routes"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#096B8A] rounded-full">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#064d63]">My Routes</h3>
                  <p className="text-gray-500 text-sm">Manage your routes</p>
                </div>
              </div>
            </Link>

            <Link
              to="/carrier/schedules"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#096B8A] rounded-full">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#064d63]">Schedules</h3>
                  <p className="text-gray-500 text-sm">Manage trip schedules</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Info Message */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Bus className="w-12 h-12 text-[#096B8A] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Welcome to Carrier Dashboard</h3>
            <p className="text-gray-500 mt-2">
              Manage your buses, routes, and schedules to offer trips to passengers.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CarrierDashboardPage;
