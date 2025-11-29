import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        if (userData.role !== "admin") {
          navigate("/");
          return;
        }

        setUser(userData);
        fetchDashboardData(userData.token);

        const freshData = await refreshUserData();
        if (freshData) {
          if (freshData.role !== "admin") {
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

  const fetchDashboardData = async (token) => {
    try {
      // Fetch all applications to calculate stats
      const [pending, approved, rejected] = await Promise.all([
        axios.get("/api/admin/carrier-applications?status=pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/admin/carrier-applications?status=approved", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/admin/carrier-applications?status=rejected", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        pendingApplications: pending.data.length,
        approvedApplications: approved.data.length,
        rejectedApplications: rejected.data.length,
      });

      // Get recent pending applications (first 5)
      setRecentApplications(pending.data.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || isLoading) {
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
            <h1 className="text-3xl font-bold text-[#064d63]">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.name}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending Applications</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingApplications}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Approved Carriers</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approvedApplications}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Rejected Applications</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejectedApplications}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <Link
              to="/admin/carrier-applications"
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 bg-[#096B8A] rounded-full">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#064d63]">Carrier Applications</h3>
                  <p className="text-gray-500 text-sm">Review and manage carrier applications</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Pending Applications */}
          {recentApplications.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#064d63]">Recent Pending Applications</h2>
                <Link
                  to="/admin/carrier-applications"
                  className="text-[#096B8A] hover:text-[#064d63] text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div
                    key={app._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Truck className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{app.companyName}</p>
                        <p className="text-sm text-gray-500">{app.userId?.email}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentApplications.length === 0 && !isLoading && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">All caught up!</h3>
              <p className="text-gray-500">No pending applications to review.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
