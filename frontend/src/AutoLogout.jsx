// src/hooks/useAutoLogout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "./supabase/axios"; // your axios instance with withCredentials: true
import { toast } from "react-toastify";

const useAutoLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // ← important: do nothing if not logged in

    let logoutTimer = null;

    const startLogoutTimer = () => {
      try {
        const decoded = jwtDecode(token);
        const expiryMs = decoded.exp * 1000;
        const now = Date.now();
        const timeLeft = expiryMs - now;

        if (timeLeft <= 0) {
          performLogout(); // already expired
          return;
        }

        logoutTimer = setTimeout(performLogout, timeLeft);
      } catch (err) {
        // malformed token → treat as invalid
        performLogout();
      }
    };

    const performLogout = async () => {
      // 1. Call backend logout (optional – clears refresh token / blacklist)
      try {
        await api.post("/api/auth/logout");
      } catch (e) {
        // ignore – we’re logging out anyway
      }

      // 2. Clean client side
      localStorage.removeItem("token");
      // remove other keys if you store them (user, cart, etc.)

      toast.info("Your session has expired. Please log in again.");

      // 3. Redirect + full reload to clear any remaining state
      navigate("/", { replace: true });
      window.location.reload();
    };

    // Start the timer
    startLogoutTimer();

    // Optional: also listen to storage events (multi-tab logout)
    const handleStorageChange = (e) => {
      if (e.key === "token" && !e.newValue) {
        performLogout();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]); // re-run only if navigate changes (very rare)
};

export default useAutoLogout;