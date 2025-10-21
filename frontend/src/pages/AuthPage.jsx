import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import Footer from "../components/Footer";

const AuthPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/send-code", { email });
      setStep("code");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/auth/verify-code", { email, code });

      localStorage.setItem("userInfo", JSON.stringify(data));

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("userInfo", JSON.stringify({ token }));

      axios
        .get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          localStorage.setItem(
            "userInfo",
            JSON.stringify({ ...res.data, token })
          );

          navigate("/");
        })
        .catch((err) => {
          console.error("Помилка авторизації:", err);
          localStorage.removeItem("userInfo");
          navigate("/login");
        });
    }
  }, [navigate]);

  const renderEmailStep = () => (
    <form onSubmit={handleSendCode}>
      <h2 className="text-xl font-semibold mb-2 text-[#064d63]">
        Log in or create an account
      </h2>
      <p className="text-sm text-gray-700 mb-6">
        You can log in with your TheLùůpa account to use our services.
      </p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#096B8A] bg-white"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className="w-full bg-[#096B8A] text-white py-3 rounded-md hover:bg-[#064d63] transition-colors font-medium disabled:bg-gray-400"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Continue with email"}
      </button>
      <button
        onClick={() => {
          window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
        }}
        className="mt-4 w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google"
          className="w-5 h-5"
        />
        {isLoading ? "Sending..." : "Continue with Google"}
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyCode}>
      <h2 className="text-xl font-semibold mb-2 text-[#064d63]">
        Confirm your email
      </h2>
      <p className="text-sm text-gray-700 mb-6">
        We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below.
      </p>
      <input
        type="text"
        placeholder="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#096B8A] bg-white text-center tracking-[0.5em]"
        maxLength="6"
        required
        disabled={isLoading}
      />
      <button
        type="submit"
        className="w-full bg-[#096B8A] text-white py-3 rounded-md hover:bg-[#064d63] transition-colors font-medium disabled:bg-gray-400"
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Confirm & Log In"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#CDEEF2] text-gray-900 relative">
      <div className="w-full bg-[#096B8A] text-white py-4 px-6 text-lg font-semibold">
        TheLùůpa
      </div>

      <button
        onClick={() => step === 'code' ? setStep('email') : navigate("/")}
        className="absolute top-20 left-8 flex items-center text-[#096B8A] hover:text-[#064d63] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex flex-col justify-center items-center flex-grow w-full">
        <div className="bg-[#CDEEF2] rounded-lg p-6 sm:p-8 w-full max-w-sm text-center shadow-md">
          {step === "email" ? renderEmailStep() : renderCodeStep()}
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AuthPage;

