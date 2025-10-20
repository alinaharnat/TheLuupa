import { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load user info from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    navigate("/");
  };

  return (
    <nav
      className="bg-[#096B8A] font-[Montserrat] relative z-50"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-white text-xl font-light px-3 py-2 rounded-lg transition-all duration-300"
              style={{ fontFamily: "Evolventa, sans-serif" }}
            >
              <span className="hover:border hover:border-[#96E5F1] hover:rounded-full px-2 py-1 transition">
                TheLùůpa
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className="bg-[#96E5F1] text-[#096B8A] px-6 py-2 rounded-full text-sm font-medium transition"
              >
                Home
              </Link>

              <Link
                to="/partner"
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
              >
                Become a Partner
              </Link>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
                  >
                    <User className="w-4 h-4 mr-1" />
                    {user.name || "User"}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-md text-gray-800">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm hover:bg-[#CDEEF2] rounded-t-lg transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm hover:bg-[#CDEEF2] rounded-b-lg transition"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:bg-[#0b5a73] p-2 rounded-md"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-[#0b5a73]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="bg-[#96E5F1] text-[#096B8A] block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/partner"
              className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
            >
              Become a Partner
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  to="/login"
                  className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
