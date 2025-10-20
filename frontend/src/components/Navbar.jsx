import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="bg-[#096B8A] font-[Montserrat]"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a
              href="#"
              className="text-white text-xl font-light px-3 py-2 rounded-lg transition-all duration-300"
              style={{ fontFamily: "Evolventa, sans-serif" }}
            >
              <span className="hover:border hover:border-[#96E5F1] hover:rounded-full px-2 py-1 transition">
                TheLùůpa
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <a
                href="#"
                className="bg-[#96E5F1] text-[#096B8A] px-6 py-2 rounded-full text-sm font-medium transition"
              >
                Home
              </a>
              <a
                href="#"
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
              >
                Become a Partner
              </a>
              <a
                href="#"
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
              >
                Register
              </a>
              <a
                href="#"
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:text-[#CDEEF2] transition"
              >
                Log in
              </a>
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
            <a
              href="#"
              className="bg-[#96E5F1] text-[#096B8A] block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </a>
            <a
              href="#"
              className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
            >
              Become a Partner
            </a>
            <a
              href="#"
              className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
            >
              Register
            </a>
            <a
              href="#"
              className="text-white hover:text-[#CDEEF2] block px-3 py-2 rounded-md text-base font-medium"
            >
              Log in
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
