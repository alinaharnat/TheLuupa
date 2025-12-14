import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, CheckCheck, Clock, MapPin, DollarSign, AlertCircle, X } from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { refreshUserData } from "../utils/refreshUser";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchNotifications(userData.token);

        const freshData = await refreshUserData();
        if (freshData) {
          setUser(freshData);
          fetchNotifications(freshData.token);
        }
      } else {
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  const fetchNotifications = async (token) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/users/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `/api/users/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        "/api/users/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "delay":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "schedule_change":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "cancellation":
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type, isRead) => {
    if (isRead) return "bg-gray-50 border-gray-200";
    switch (type) {
      case "delay":
        return "bg-orange-50 border-orange-200";
      case "schedule_change":
        return "bg-blue-50 border-blue-200";
      case "cancellation":
        return "bg-red-50 border-red-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#CDEEF2]">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-[#096B8A]" />
                <div>
                  <h1 className="text-2xl font-semibold text-[#064d63]">Notifications</h1>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#096B8A] hover:bg-[#CDEEF2] rounded-md transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#096B8A] border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  // Use stored scheduleDetails if schedule is deleted, otherwise use populated data
                  const scheduleDetails = notification.scheduleDetails;
                  const route = notification.scheduleId?.routeId;
                  const fromCity = scheduleDetails?.from || route?.cityId?.[0]?.name || "Unknown";
                  const toCity = scheduleDetails?.to || route?.cityId?.[route?.cityId?.length - 1]?.name || "Unknown";

                  return (
                    <div
                      key={notification._id}
                      className={`border rounded-lg p-4 transition-colors ${getNotificationColor(
                        notification.type,
                        notification.isRead
                      )}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-[#096B8A] transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="bg-white rounded-md p-3 mb-3 border border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {fromCity} → {toCity}
                              </span>
                            </div>

                            {notification.changes && Object.keys(notification.changes).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-2">Changes:</p>
                                <div className="space-y-1 text-xs">
                                  {notification.changes.departureTime && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-600">
                                        <strong>Departure:</strong> {formatTime(notification.changes.departureTime.old)} → {formatTime(notification.changes.departureTime.new)}
                                      </span>
                                    </div>
                                  )}
                                  {notification.changes.arrivalTime && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-600">
                                        <strong>Arrival:</strong> {formatTime(notification.changes.arrivalTime.old)} → {formatTime(notification.changes.arrivalTime.new)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {notification.type === "cancellation" && scheduleDetails && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-2">Trip Details:</p>
                                <div className="space-y-1 text-xs text-gray-600">
                                  {scheduleDetails.departureTime && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span>
                                        <strong>Departure:</strong> {formatDateTime(scheduleDetails.departureTime)}
                                      </span>
                                    </div>
                                  )}
                                  {scheduleDetails.arrivalTime && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span>
                                        <strong>Arrival:</strong> {formatDateTime(scheduleDetails.arrivalTime)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {formatDateTime(notification.createdAt)}
                            </p>
                            {notification.isRead && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                Read
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotificationsPage;

