import { useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search, Calendar, Users, ArrowLeftRight } from "lucide-react";
import heroImg from "../assets/heroImg.jpg";
import "../styles/datepicker.css";

export default function Hero() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(null);
  const [passengers, setPassengers] = useState(1);
  const [error, setError] = useState("");
  const today = new Date();

  const handleSwapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!from || !to || !date) {
      setError("Please fill in all fields.");
      return;
    }
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setError("Departure and destination must be different.");
      return;
    }
    if (date < new Date(today.setHours(0, 0, 0, 0))) {
      setError("Date cannot be earlier than today.");
      return;
    }
    if (passengers < 1 || passengers > 50) {
      setError("Number of passengers must be between 1 and 50.");
      return;
    }
    setError("");

    // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const searchParams = new URLSearchParams({
      from: from.trim(),
      to: to.trim(),
      date: dateString,
      passengers: passengers.toString()
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1 w-full">
      <input
        type="text"
        value={value}
        ref={ref}
        placeholder="dd.mm.yy"
        readOnly
        className="w-full outline-none text-gray-700 cursor-pointer"
        onClick={onClick}
      />
      <Calendar
        size={18}
        className="ml-2 cursor-pointer text-gray-600"
        onClick={onClick}
      />
    </div>
  ));

  return (
    <section
  className="relative flex items-center justify-center min-h-[90vh] min-w-[320px] px-4 sm:px-6 md:px-0 bg-cover bg-center"
  style={{ backgroundImage: `url(${heroImg})` }}
>

  <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">
    <form
      onSubmit={handleSearch}
      className="flex flex-wrap items-center w-full bg-white rounded-full shadow-lg overflow-hidden pr-4"
    >
      <input
        type="text"
        placeholder="From"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="flex-1 min-w-[100px] px-6 py-3 text-gray-700 focus:outline-none text-sm md:text-base"
      />
      <button
        type="button"
        onClick={handleSwapLocations}
        className="hidden sm:flex items-center justify-center p-2 text-[#096B8A] hover:bg-[#096B8A]/10 rounded-full transition"
        title="Swap locations"
      >
        <ArrowLeftRight size={20} />
      </button>
      <input
        type="text"
        placeholder="Where"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="flex-1 min-w-[100px] px-6 py-3 text-gray-700 focus:outline-none text-sm md:text-base"
      />
      <div className="hidden sm:block w-px h-6 bg-[#096B8A]/30"></div>
      <div className="flex-1 min-w-[100px] px-6 py-3 text-gray-700 text-sm md:text-base">
        <DatePicker
          selected={date}
          onChange={(d) => setDate(d)}
          minDate={today}
          dateFormat="dd.MM.yy"
          customInput={<CustomInput />}
          calendarClassName="custom-calendar"
        />
      </div>
      <div className="hidden sm:block w-px h-6 bg-[#096B8A]/30"></div>
      <div className="flex items-center flex-1 min-w-[100px] px-6 py-3">
        <Users size={18} className="text-gray-600 mr-2" />
        <input
          type="number"
          min="1"
          max="50"
          value={passengers}
          onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
          className="w-full outline-none text-gray-700 text-sm md:text-base"
        />
      </div>
      <button
        type="submit"
        className="bg-[#096B8A] hover:bg-[#07576f] text-white p-2.5 rounded-full transition flex items-center justify-center ml-0 sm:ml-2 mt-2 sm:mt-0"
      >
        <Search size={18} />
      </button>
    </form>

    {error && <p className="text-[#96E5F1] mt-4">{error}</p>}

    <h1 className="mt-8 sm:mt-16 text-xl sm:text-2xl md:text-3xl font-medium text-white">
      Where travel dreams hit the road!
    </h1>
    <button
  onClick={() => navigate("/surprise")}
  className="bg-orange-500 text-white rounded-full px-6 py-3"
>
  🎁 Surprise me!
</button>
  </div>
</section>

  );
}
