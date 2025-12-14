import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import BookingPage from "./pages/BookingPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SurprisePage from "./pages/SurprisePage";
import BecomeCarrierPage from "./pages/BecomeCarrierPage";
import AdminCarrierApplicationsPage from "./pages/AdminCarrierApplicationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CarrierCompanyPage from "./pages/CarrierCompanyPage";
import MyBusesPage from "./pages/MyBusesPage";
import MyRoutesPage from "./pages/MyRoutesPage";
import MySchedulesPage from "./pages/MySchedulesPage";
import CarrierBookingsPage from "./pages/CarrierBookingsPage";
import HomeRouter from "./components/HomeRouter";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRouter />} />
        <Route path="/register" element={<AuthPage/>} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/success" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/booking/:scheduleId" element={<BookingPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/surprise" element={<SurprisePage />} />
        <Route path="/become-carrier" element={<BecomeCarrierPage />} />
        <Route path="/admin/carrier-applications" element={<AdminCarrierApplicationsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/carrier/company" element={<CarrierCompanyPage />} />
        <Route path="/carrier/buses" element={<MyBusesPage />} />
        <Route path="/carrier/routes" element={<MyRoutesPage />} />
        <Route path="/carrier/schedules" element={<MySchedulesPage />} />
        <Route path="/carrier/bookings" element={<CarrierBookingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
