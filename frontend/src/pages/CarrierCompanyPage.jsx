import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Phone, FileText, Mail, Calendar, Bus, Route, Users, TrendingUp } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const CarrierCompanyPage = () => {
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

        // Refresh from server
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
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>

          {/* Company Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#096B8A] rounded-full">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#064d63]">{user.companyName}</h1>
                <p className="text-gray-500">Carrier Account</p>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#064d63] mb-4">Company Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-[#096B8A]" />
                <div>
                  <p className="text-xs text-gray-500">Company Name</p>
                  <p className="font-medium text-gray-800">{user.companyName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-[#096B8A]" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-800">{user.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-[#096B8A]" />
                <div>
                  <p className="text-xs text-gray-500">License Number</p>
                  <p className="font-medium text-gray-800">{user.licenseNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-[#096B8A]" />
                <div>
                  <p className="text-xs text-gray-500">Contact Email</p>
                  <p className="font-medium text-gray-800">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-[#064d63] mb-4">Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Bus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-400">-</p>
                <p className="text-xs text-gray-400">Buses</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Route className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-400">-</p>
                <p className="text-xs text-gray-400">Routes</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-400">-</p>
                <p className="text-xs text-gray-400">Trips</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-400">-</p>
                <p className="text-xs text-gray-400">Passengers</p>
              </div>
            </div>

            <p className="text-center text-gray-400 text-sm mt-4">
              Statistics will be available when you add buses and routes
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CarrierCompanyPage;
