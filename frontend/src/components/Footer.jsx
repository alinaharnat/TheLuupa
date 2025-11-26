import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <footer className="bg-[#096B8A] text-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3
              className="text-2xl font-light mb-2"
              style={{ fontFamily: "Evolventa, sans-serif" }}
            >
              TheLùůpa
            </h3>
            <p className="text-[#CDEEF2] text-sm mb-2">
              Where travel dreams hit the road! Your trusted bus booking platform.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-[#CDEEF2] hover:text-white transition text-sm"
                >
                  Home
                </Link>
              </li>
              {(!user || (user.role !== "carrier" && user.role !== "admin")) && (
                <li>
                  <Link
                    to="/become-carrier"
                    className="text-[#CDEEF2] hover:text-white transition text-sm"
                  >
                    Become a Carrier
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/profile"
                  className="text-[#CDEEF2] hover:text-white transition text-sm"
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[#CDEEF2] text-sm">
                <Mail size={16} />
                <a
                  href="mailto:support@theluupa.com"
                  className="hover:text-white transition"
                >
                  support@theluupa.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-[#CDEEF2] text-sm">
                <Phone size={16} />
                <span>+380 (44) 777-77-77</span>
              </li>
              <li className="flex items-center gap-2 text-[#CDEEF2] text-sm">
                <MapPin size={16} />
                <span>Kharkiv, Ukraine</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#96E5F1]/30 mt-4 pt-3 text-center">
          <p className="text-[#CDEEF2] text-sm">
            © {currentYear} TheLùůpa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
