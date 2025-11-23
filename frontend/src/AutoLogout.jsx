// src/hooks/useAutoLogout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./supabase/axios"; // your axios instance with withCredentials: true
import { toast } from "react-toastify";

const useAutoLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
  let timeoutId = null;

  const resetTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      checkSession(); // only runs after 30 minutes of inactivity
    }, 30 * 60 * 1000); // 30 minutes
  };

  const checkSession = async () => {
    try {
      await api.get("/api/auth/me");
    } catch (err) {
      if (err.response?.status === 401) {
        await api.post("/api/auth/logout").catch(() => {});
        toast.info("Session expired — please log in again.");
        navigate("/account", { replace: true });
        window.location.reload();
      }
    }
  };

  // Reset timer on any user activity
  const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
  events.forEach(event => window.addEventListener(event, resetTimer, true));

  // Start timer
  resetTimer();

  return () => {
    events.forEach(event => window.removeEventListener(event, resetTimer, true));
    if (timeoutId) clearTimeout(timeoutId);
  };
}, [navigate]);
};

export default useAutoLogout;