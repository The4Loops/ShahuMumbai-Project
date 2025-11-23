// src/pages/AuthCallback.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../supabase/axios";
import { toast } from "react-toastify";
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

  useEffect(() => {
    setLoading(true);

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");
    const error = params.get("error");

    if (error || !idToken) {
      toast.error(error ? `Google login failed: ${error}` : "No token received from Google");
      setLoading(false);
      navigate("/account");
      return;
    }

    // ---------- EXCHANGE TOKEN ----------
    api.post("/api/auth/ssoLogin",{},{ headers: { Authorization: `Bearer ${idToken}` } })
      .then((res) => {
        const { user } = res.data;

        toast.dismiss();
        toast.success("Welcome back");

        if (user?.role === "Admin") {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(err.response?.data?.error || err.message || "Google login failed.");
        navigate("/account");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, setLoading]);

  /* ------------------------------------------------------------------ */
  return (
    <Layout>
      <div className="min-h-screen bg-[#F1E7E5]">
        <CallbackSkeleton />
      </div>
    </Layout>
  );
};

export default AuthCallback;