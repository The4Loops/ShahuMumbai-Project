// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import Layout from "../layout/Layout";
import { useLoading } from "../context/LoadingContext";   // <-- NEW

/* ------------------------------------------------------------------ */
/*                     FULL‑SCREEN SKELETON (while exchanging token)   */
/* ------------------------------------------------------------------ */
const CallbackSkeleton = () => (
  <div className="min-h-screen bg-[#F1E7E5] flex flex-col items-center justify-center space-y-6 animate-pulse">
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xs space-y-4">
      <div className="h-6 bg-gray-200 rounded w-32 mx-auto" />
      <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
      <div className="h-10 bg-gray-200 rounded w-full" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
const AuthCallback = () => {
  const { setLoading } = useLoading();                 // <-- NEW
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);  // local flag

  useEffect(() => {
    // Turn the global spinner ON immediately
    setLoading(true);
    setProcessing(true);

    const params = new URLSearchParams(window.location.hash.substring(1));
    const idToken = params.get("id_token");
    const error = params.get("error");

    // ---------- ERROR FROM GOOGLE ----------
    if (error) {
      toast.error(`Google login failed: ${error}`);
      setLoading(false);
      setProcessing(false);
      navigate("/account");
      return;
    }

    // ---------- NO TOKEN ----------
    if (!idToken) {
      toast.error("Google login failed: No ID token received.");
      setLoading(false);
      setProcessing(false);
      navigate("/account");
      return;
    }

    // ---------- EXCHANGE TOKEN ----------
    api
      .post(
        "/api/auth/ssoLogin",
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      )
      .then((res) => {
        const { token } = res.data;

        // Store token
        try {
          localStorage.setItem("token", token);
        } catch (storageError) {
          toast.error("Failed to store authentication token.");
          setLoading(false);
          setProcessing(false);
          navigate("/account");
          return;
        }

        // Decode & route
        let decoded;
        try {
          decoded = jwtDecode(token);
        } catch (decodeError) {
          localStorage.removeItem("token");
          toast.error("Invalid token format.");
          setLoading(false);
          setProcessing(false);
          navigate("/account");
          return;
        }

        const userRole = decoded.role;
        toast.dismiss();
        toast.success("Google login successful!");

        setLoading(false);
        setProcessing(false);

        if (userRole === "Admin") {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(err.response?.data?.error || err.message || "Google login failed.");
        setLoading(false);
        setProcessing(false);
        navigate("/account");
      });
  }, [navigate, setLoading]);

  /* ------------------------------------------------------------------ */
  return (
    <Layout>
      <div className="min-h-screen bg-[#F1E7E5]">
        {processing ? <CallbackSkeleton /> : null}
      </div>
    </Layout>
  );
};

export default AuthCallback;