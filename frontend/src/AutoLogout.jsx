// src/hooks/useAutoLogout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./supabase/axios"; // your axios with withCredentials: true
import { toast } from "react-toastify";

const useAutoLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;

    const checkAuthStatus = async () => {
      try {
        // This will fail with 401 if token expired or invalid
        await api.get("/api/auth/me");
        // If successful → user still logged in → do nothing
      } catch (err) {
        if (err.response?.status === 401) {
          // Token expired or invalid → log out
          await handleLogout();
        }
      }
    };

    const handleLogout = async () => {
      try {
        await api.post("/api/auth/logout"); // clears HttpOnly cookie
      } catch (e) {
        // ignore network errors — we’re logging out anyway
      } finally {
        toast.info("Session expired. Please log in again.");
        navigate("/account");
        // Optional: reload to fully reset app state
        setTimeout(() => window.location.reload(), 500);
      }
    };

    // Check every 30 seconds (safe & lightweight)
    interval = setInterval(checkAuthStatus, 30_000);

    // Initial check on mount
    checkAuthStatus();

    // Cleanup
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [navigate]);
};

export default useAutoLogout;