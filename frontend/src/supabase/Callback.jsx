import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../supabase/axios";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const idToken = params.get("id_token");
    const error = params.get("error");

    if (error) {
      console.error("Google OAuth Error:", error);
      toast.error(`Google login failed: ${error}`);
      navigate("/account");
      return;
    }

    if (!idToken) {
      console.error("No ID token found in URL hash");
      toast.error("Google login failed: No ID token received.");
      navigate("/account");
      return;
    }

    console.log("Google ID Token:", idToken);

    api
      .post("/api/auth/ssoLogin", {}, { headers: { Authorization: `Bearer ${idToken}` } })
      .then((res) => {
        const { token } = res.data;
        try {
          localStorage.setItem("token", token);
        } catch (storageError) {
          console.error("Storage Error:", storageError);
          toast.error("Failed to store authentication token.");
          navigate("/account");
          return;
        }

        let decoded;
        try {
          decoded = jwtDecode(token);
        } catch (decodeError) {
          console.error("Token Decode Error:", decodeError);
          localStorage.removeItem("token");
          toast.error("Invalid token format.");
          navigate("/account");
          return;
        }

        const userRole = decoded.role;
        toast.dismiss();
        toast.success(res.data.message || "SSO login successful!");

        if (userRole === "Admin") {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      })
      .catch((error) => {
        console.error("SSO Login Error:", error);
        toast.dismiss();
        toast.error(error.response?.data?.error || error.message || "Google login failed.");
        navigate("/account");
      });
  }, [navigate]);

  return <div>Logging you in with Google...</div>;
};

export default AuthCallback;