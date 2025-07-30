import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import emailjs from "@emailjs/browser";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import tshirtImg from "/Image/register.png";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export default function Register({ onClose, onSwitch }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    const otp = generateOTP();
    setGeneratedOtp(otp);

    const message = `Your OTP is: ${otp}`;

    try {
      await emailjs.send(
        "service_rt0g665",
        "template_vfv8nbe",
        {
          name: form.username,
          email: form.email,
          message: message,
        },
        "AljJ9kLnaEMdIKloP"
      );
      setOtpSent(true);
      setError("");
      toast.success("OTP sent to your email!");
    } catch (err) {
      console.error("EmailJS Error:", err);
      setError("Failed to send OTP.");
      toast.error("Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (enteredOtp !== generatedOtp) {
      setError("Incorrect OTP.");
      toast.error("Incorrect OTP.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // Assign role based on email
      const role =
        form.email.toLowerCase() === "vasanthloagn2525@gmail.com"
          ? "admin"
          : "user";

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: role, // ✅ Save role to Firestore
        createdAt: new Date().toISOString(),
      });

      toast.success("Registration successful! Redirecting to login...");
      setTimeout(() => {
        onClose();
        onSwitch(); // Go to login
      }, 2000);
    } catch (err) {
      console.error("Firebase Registration Error:", err);
      setError(err.message);
      toast.error("Registration failed. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50">
      <div className="relative flex w-full max-w-5xl rounded-lg bg-gray-300 shadow-lg overflow-hidden">
        <button
          className="absolute top-4 right-4 text-2xl text-primary"
          onClick={onClose}
        >
          <IoClose />
        </button>
        <div className="hidden md:flex w-1/2 bg-white/60 items-center justify-center">
          <img src={tshirtImg} alt="T-shirt" className="w-full h-[90vh]" />
        </div>
        <div className="w-full h-[95vh] bg-white md:w-1/2 p-4 md:p-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/Image/logo.png"
              className="w-18 h-18 md:w-23 md:h-23 text-center bg-primary rounded-full"
            />
          </div>
          <h2 className="text-xl font-semibold text-center text-primary uppercase mb-4">
            {otpSent ? "Enter OTP" : "Create Account"}
          </h2>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <form
            onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
            className="space-y-3"
          >
            {!otpSent ? (
              <>
                <input
                  name="name"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full border-b mb-5 px-2 py-2 border-primary placeholder-primary text-primary"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  className="w-full border-b mb-6 px-2 py-2 border-primary placeholder-primary text-primary"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-[#283b53] text-white py-2 rounded"
                >
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <input
                  name="otp"
                  placeholder="Enter OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full border-b border-primary px-2 mb-6 text-primary py-2 placeholder-primary"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-[#283b53] text-white py-2 my-2 rounded"
                >
                  Verify & Register
                </button>
              </>
            )}
          </form>
          <p className="text-center mt-3 text-sm text-black">
            Already have an account?{" "}
            <button onClick={onSwitch} className="text-primary underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
