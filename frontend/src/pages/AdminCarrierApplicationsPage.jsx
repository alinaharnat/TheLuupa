import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, XCircle, Building2, Phone, FileText, User, Mail, Filter } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const AdminCarrierApplicationsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, applicationId: null, action: null });
  const initialLoadDone = useRef(false);

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

        if (!initialLoadDone.current) {
          fetchApplications(userData.token, statusFilter);
          initialLoadDone.current = true;

          const freshData = await refreshUserData();
          if (freshData && freshData.role !== "admin") {
            navigate("/");
          }
        }
      } else {
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  useEffect(() => {
    if (user && initialLoadDone.current) {
      fetchApplications(user.token, statusFilter);
    }
  }, [statusFilter]);

  const fetchApplications = async (token, status) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/carrier-applications?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch applications");
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmModal = (applicationId, action) => {
    setConfirmModal({ isOpen: true, applicationId, action });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, applicationId: null, action: null });
  };

  const handleReview = async () => {
    const { applicationId, action } = confirmModal;
    setProcessingId(applicationId);

    try {
      await axios.put(
        `/api/admin/carrier-applications/${applicationId}`,
        { status: action },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      fetchApplications(user.token, statusFilter);
      closeConfirmModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process application");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

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
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h1 className="text-2xl font-semibold text-[#064d63] mb-6">Carrier Applications</h1>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {["pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-[#096B8A] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="capitalize">{status}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No {statusFilter} applications found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusIcon(app.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                            {app.status.toUpperCase()}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{app.userId?.name || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{app.userId?.email || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span>{app.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{app.phoneNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 md:col-span-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>License: {app.licenseNumber}</span>
                          </div>
                        </div>

                        </div>

                      {app.status === "pending" && (
                        <div className="flex gap-2 md:flex-col">
                          <button
                            onClick={() => openConfirmModal(app._id, "approved")}
                            disabled={processingId === app._id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium disabled:bg-gray-400"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => openConfirmModal(app._id, "rejected")}
                            disabled={processingId === app._id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium disabled:bg-gray-400"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-semibold text-[#064d63] mb-4">
              {confirmModal.action === "approved" ? "Approve" : "Reject"} Application?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReview}
                disabled={processingId}
                className={`flex-1 py-2 rounded-md text-white font-medium transition-colors disabled:bg-gray-400 ${
                  confirmModal.action === "approved"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {processingId ? "Processing..." : "Yes"}
              </button>
              <button
                onClick={closeConfirmModal}
                disabled={processingId}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminCarrierApplicationsPage;
