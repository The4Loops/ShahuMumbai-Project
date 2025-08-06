import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

const useAutoLogout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000; // convert to milliseconds
      const currentTime = Date.now();
      const timeLeft = expiryTime - currentTime;

      if (timeLeft <= 0) {
        // Token already expired
        handleLogout();
      } else {
        // Set timeout for logout when token expires
        const timer = setTimeout(() => {
          handleLogout();
        }, timeLeft);

        // Cleanup on component unmount
        return () => clearTimeout(timer);
      }
    }
  }, []);

   const handleLogout = () => {
    localStorage.removeItem('token');
    // Clear other local storage or session storage if needed
    navigate('/account');
    window.location.reload(); // Optional: to reset app state
  };
};

export default useAutoLogout;
