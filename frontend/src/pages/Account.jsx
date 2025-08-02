import React, { useState } from "react";
import api from "../supabase/axios";
import supabase from '../supabase/SupaBase';

const TextInput = ({
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}) => (
  <>
    <input
      type={type}
      name={name}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      aria-invalid={!!error}
      aria-describedby={`${name}-error`}
      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 transition-colors"
    />
    {error && (
      <p id={`${name}-error`} className="text-sm text-red-500">
        {error}
      </p>
    )}
  </>
);

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const resetForm = () => {
    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (isRegistering && !formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (isRegistering && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        if (!otpSent) {
          // Step 1: Send OTP
          await api.post(`/api/auth/register/send-otp`, {
            email: formData.email,
            full_name: formData.fullName,
            password: formData.password,
          });
          setOtpSent(true);
          alert("OTP sent to your email.");
        } else {
          // Step 2: Verify OTP and Register
          await api.post(`/api/auth/register/verify`, {
            email: formData.email,
            full_name: formData.fullName,
            password: formData.password,
            otp: otp,
          });
          alert("Registration successful. You can now login.");
          setIsRegistering(false);
          resetForm();
          setOtpSent(false);
          setOtp("");
        }
      } else {
        // Login Flow
        const res = await api.post(`/api/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", res.data.token);
        alert("Login successful!");
        // Navigate to home/dashboard
      }
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSSO = async() => {
   const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.REACT_APP_API_BASE_URL}/auth/callback`
    }
  });

  if (error) console.error('SSO login failed:', error.message);
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 min-h-36">
      <div className="bg-white p-6 sm:p-8 rounded-lg w-full max-w-sm shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isRegistering ? "Register" : "Sign In"}
          </h2>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              resetForm();
              setOtpSent(false);
              setOtp('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isRegistering ? "Have an account? Sign In" : "Create Account"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleSSO}
          className="flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mb-4 w-full"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          {isRegistering ? "Sign up with Google" : "Sign in with Google"}
        </button>

        <div className="relative text-center my-3 text-sm text-gray-500">
          <span className="before:absolute before:left-0 before:top-1/2 before:w-[40%] before:h-px before:bg-gray-300 after:absolute after:right-0 after:top-1/2 after:w-[40%] after:h-px after:bg-gray-300">
            OR
          </span>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {isRegistering && (
            <TextInput
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              autoComplete="name"
            />
          )}

          <TextInput
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />

          <TextInput
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete={isRegistering ? "new-password" : "current-password"}
          />

          {isRegistering && (
            <TextInput
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          )}

          {isRegistering && otpSent && (
            <TextInput
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              error={otp ? '' : 'OTP is required'}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-gray-900 text-white font-semibold py-2 rounded-md transition-colors ${
              isSubmitting
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-gray-800"
            }`}
          >
             {isSubmitting ? 'Submitting...' : isRegistering ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Login'}
          </button>
        </form>

        {!isRegistering && (
          <label className="text-sm text-gray-700 mt-2 flex items-center">
            <input type="checkbox" className="mr-2" />
            Remember me
          </label>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
