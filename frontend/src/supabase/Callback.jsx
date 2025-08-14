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
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          toast.dismiss();
          toast.error("Failed to retrieve session. Please login again.");
          navigate("/");
          return;
        }

        const token = data.session.access_token;

        // Axios POST Request to backend SSO login API
        const res = await api.post(
          "/api/auth/ssoLogin",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true, // If needed for cookies
            validateStatus: () => true, // <-- Allow all responses to handle manually
          }
        );

        if (res.status === 200 && res.data?.token) {
          localStorage.setItem("token", res.data.token);

          const decoded = jwtDecode(res.data.token);
          const role = decoded.role;

          toast.dismiss();
          toast.success("Login Successful!");

          if (role === "admin") {
            navigate("/admin");
          } else {
            navigate("/home");
          }
        } else if (res.status === 403) {
          toast.dismiss();
          toast.error("SSO Login is not allowed for this user.");
          navigate("/home");
        } else {
          toast.dismiss();
          toast.error(res.data?.error || "SSO Login failed.");
          navigate("/home");
        }
      } catch (err) {
        toast.dismiss();
        toast.error("Network error occurred. Please try again.");
        console.error(err);
        navigate("/home");
      }
    };

    fetchSession();
  }, [navigate]);

  return <p>Logging you in with Google...</p>;
};

export default Callback;
