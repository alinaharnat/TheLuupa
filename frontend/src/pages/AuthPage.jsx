import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#CDEEF2] text-gray-900 relative">
      {/* Верхня панель */}
      <div className="w-full bg-[#096B8A] text-white py-4 px-6 text-lg font-semibold">
        TheLùůpa
      </div>

      {/* Кнопка повернення */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-20 left-8 flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Основний контейнер */}
      <div className="flex flex-col justify-center items-center flex-grow w-full">
        <div className="bg-[#CDEEF2] rounded-lg p-6 sm:p-8 w-full max-w-sm text-center shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-[#064d63]">
            Log in or create an account
          </h2>
          <p className="text-sm text-gray-700 mb-6">
            You can log in with your TheLùůpa.com account to use our services.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Email:", email);
            }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#096B8A] bg-white"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#096B8A] text-white py-3 rounded-md hover:bg-[#064d63] transition-colors font-medium"
            >
              Continue with email
            </button>
          </form>

          <div className="mt-5 text-sm text-gray-600">
            or choose another option
          </div>
        </div>
      </div>

      {/* Нижня смуга для візуального балансу */}
      <div className="w-full h-4 bg-[#96E5F1]" />
    </div>
  );
};

export default AuthPage;
