import React, { useState, useEffect } from "react";
import HomePage from "../pages/HomePage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import CarrierDashboardPage from "../pages/CarrierDashboardPage";
import { refreshUserData } from "../utils/refreshUser";

const HomeRouter = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        // Show cached data first
        setUser(JSON.parse(storedUser));
        // Then refresh from server
        const freshData = await refreshUserData();
        if (freshData) {
          setUser(freshData);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#CDEEF2]">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  // Show admin dashboard for admin users
  if (user && user.role === "admin") {
    return <AdminDashboardPage />;
  }

  // Show carrier dashboard for carrier users
  if (user && user.role === "carrier") {
    return <CarrierDashboardPage />;
  }

  // Show regular homepage for passengers and guests
  return <HomePage />;
};

export default HomeRouter;
