import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Truck, Building2, Phone, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const BecomeCarrierPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    phoneNumber: "",
    licenseNumber: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Redirect if already a carrier
        if (userData.role === "carrier") {
          navigate("/carrier");
          return;
        }

        // Fetch existing application
        fetchApplication(userData.token);

        // Refresh from server
        const freshData = await refreshUserData();
        if (freshData) {
          if (freshData.role === "carrier") {
            navigate("/carrier");
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

  const fetchApplication = async (token) => {
    try {
      const { data } = await axios.get("/api/users/carrier-application", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplication(data);
    } catch (err) {
      // No application found is fine
      if (err.response?.status !== 404) {
        console.error("Error fetching application:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await axios.post(
        "/api/users/carrier-application",
        {
          companyName: formData.companyName,
          phoneNumber: formData.phoneNumber,
          licenseNumber: formData.licenseNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setApplication(data);
      setSuccess("Your application has been submitted successfully!");
      setFormData({ companyName: "", phoneNumber: "", licenseNumber: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 border-yellow-400 text-yellow-800";
      case "approved":
        return "bg-green-100 border-green-400 text-green-800";
      case "rejected":
        return "bg-red-100 border-red-400 text-red-800";
      default:
        return "";
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#CDEEF2]">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  const canSubmitNewApplication = !application || application.status === "rejected";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow bg-[#CDEEF2] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#096B8A] rounded-full">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-[#064d63]">Become a Carrier</h1>
            </div>

            {/* Show existing application status */}
            {application && (
              <div className={`mb-6 p-4 border rounded-lg ${getStatusColor(application.status)}`}>
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(application.status)}
                  <h2 className="text-lg font-semibold capitalize">
                    Application {application.status}
                  </h2>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Company:</strong> {application.companyName}</p>
                  <p><strong>Phone:</strong> {application.phoneNumber}</p>
                  <p><strong>License:</strong> {application.licenseNumber}</p>
                  <p><strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
                  {application.reviewedAt && (
                    <p><strong>Reviewed:</strong> {new Date(application.reviewedAt).toLocaleDateString()}</p>
                  )}
                </div>

                {application.status === "pending" && (
                  <p className="mt-4 text-sm">
                    Your application is being reviewed. You will receive an email notification once it's processed.
                  </p>
                )}

                {application.status === "rejected" && (
                  <p className="mt-4 text-sm">
                    You can submit a new application with updated information below.
                  </p>
                )}
              </div>
            )}

            {/* Show form if can submit */}
            {canSubmitNewApplication && (
              <>
                <p className="text-gray-600 mb-6">
                  Join our platform as a carrier and start offering your transportation services.
                  Fill in the required details below to submit your application.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Company Name <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          License Number <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your carrier license number"
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#096B8A]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-[#096B8A] text-white rounded-md hover:bg-[#064d63] transition-colors font-medium disabled:bg-gray-400"
                  >
                    <Truck className="w-5 h-5" />
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BecomeCarrierPage;
