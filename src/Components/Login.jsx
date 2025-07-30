// Login.jsx
import React, { useState, useContext, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { IoClose } from "react-icons/io5";
import { AuthContext } from "../Context/AuthContext";
import tshirtImg from "/Image/login.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login({ onClose, onSwitch }) {
  const { loginWithEmail, loginWithGoogle, resetPassword } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedChecked = localStorage.getItem("rememberMe") === "true";
    if (savedEmail && savedChecked) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(form.email, form.password);
      toast.success("Login successful!");

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.setItem("rememberMe", "false");
      }

      onClose();
      // navigate("/");
    } catch (err) {
      toast.error("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success("Google login successful!");
      onClose();
      // navigate("/");
    } catch (err) {
      toast.error("Google login failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      toast.error("Please enter your email to reset password");
      return;
    }
    try {
      await resetPassword(form.email);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error("Failed to send reset email");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50">
      <div className="relative flex w-full max-w-4xl rounded-lg bg-gray-300 shadow-lg overflow-hidden">
        <button className="absolute top-4 right-4 text-2xl text-primary" onClick={onClose}>
          <IoClose />
        </button>

        <div className="hidden md:flex w-1/2 bg-white/60 items-center justify-center">
          <img src={tshirtImg} alt="T-shirt" className="w-full h-full object-contain" />
        </div>

        <div className="w-full bg-white md:w-1/2 p-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/Image/logo.png"
              alt="Logo"
              className="w-23 h-23 text-center bg-primary rounded-full"
            />
          </div>
          <h2 className="text-xl font-semibold text-center text-primary uppercase mb-4">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border-b px-4 py-2 border-primary mb-5 placeholder-primary text-primary"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border-b px-4 py-2 mb-2 border-primary placeholder-primary text-primary"
              required
            />

            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center text-sm text-primary">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Remember Me
              </label>
              <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="w-full bg-[#283b53] text-white py-2 rounded">
              Sign In
            </button>
          </form>

          <div className="my-4 text-center text-gray-500">or</div>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full border py-2 rounded text-sm font-medium text-black bg-white hover:bg-gray-100 transition"
          >
            <FcGoogle className="text-xl mr-2" />
            Sign in with Google
          </button>

          <p className="text-center mt-3 text-sm text-black">
            Don't have an account?{" "}
            <button onClick={onSwitch} className="text-primary underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
