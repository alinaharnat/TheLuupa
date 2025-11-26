import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import BookingPage from "./pages/BookingPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import SurprisePage from "./pages/SurprisePage";
import BecomeCarrierPage from "./pages/BecomeCarrierPage";
import AdminCarrierApplicationsPage from "./pages/AdminCarrierApplicationsPage";
import CarrierCompanyPage from "./pages/CarrierCompanyPage";
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
        <Route path="/surprise" element={<SurprisePage />} />
        <Route path="/become-carrier" element={<BecomeCarrierPage />} />
        <Route path="/admin/carrier-applications" element={<AdminCarrierApplicationsPage />} />
        <Route path="/carrier/company" element={<CarrierCompanyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
