import axios from "axios";

/**
 * Fetches fresh user data from server and updates localStorage
 * @returns {Promise<object|null>} Updated user data or null if failed
 */
export const refreshUserData = async () => {
  try {
    const storedUser = localStorage.getItem("userInfo");
    if (!storedUser) return null;

    const userData = JSON.parse(storedUser);
    if (!userData.token) return null;

    const { data } = await axios.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${userData.token}` },
    });

    // Merge new data with existing (keep token)
    const updatedUser = {
      ...userData,
      ...data,
      token: userData.token,
    };

    localStorage.setItem("userInfo", JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error("Error refreshing user data:", error);
    // If unauthorized, clear localStorage
    if (error.response?.status === 401) {
      localStorage.removeItem("userInfo");
    }
    return null;
  }
};
