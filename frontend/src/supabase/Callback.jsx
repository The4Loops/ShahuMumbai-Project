import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./axios";
import supabase from "./SupaBase";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Retrieve Supabase session
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          toast.dismiss();
          toast.error("Failed to retrieve session. Please login again.");
          navigate("/");
          return;
        }

        const accessToken = data.session.access_token;
        if (!accessToken) {
          toast.dismiss();
          toast.error("No access token found in session.");
          navigate("/");
          return;
        }

        // Send SSO request to backend
        const res = await api.post(
          "/api/auth/ssoLogin",
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true, // If needed for cookies
          }
        );

        if (res.status === 200 && res.data?.token) {
          // Store token in localStorage
          try {
            localStorage.setItem("token", res.data.token);
          } catch (storageError) {
            toast.error("Failed to store authentication token. Please try again.", storageError);
            navigate("/");
            return;
          }

          // Decode token
          let decoded;
          try {
            decoded = jwtDecode(res.data.token);
          } catch (decodeError) {
            localStorage.removeItem("token"); // Clean up invalid token
            toast.error("Invalid token format.", decodeError);
            navigate("/");
            return;
          }

          const role = decoded.role;
          toast.dismiss();
          toast.success(res.data.message || "Login Successful!");

          // Navigate based on role
          if (role === "Admin") {
            navigate("/admin");
          } else {
            navigate("/profile");
          }
        } else {
          toast.dismiss();
          toast.error(res.data?.error || "SSO Login failed.");
          navigate("/");
        }
      } catch (err) {
        toast.dismiss();
        toast.error(err.response?.data?.error || err.message || "An error occurred during SSO login.");
        navigate("/");
      }
    };

    fetchSession();
  }, [navigate]);

  return <p>Logging you in with Google...</p>;
};

export default Callback;