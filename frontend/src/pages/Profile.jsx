import React from "react";
import Layout from "../layout/Layout";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const token = localStorage.getItem("token");

  if (!token) return <p>Please login to view your profile.</p>;

  let decoded = {};
  try {
    decoded = jwtDecode(token);
  } catch (e) {
    return <p>Invalid token. Please login again.</p>;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Welcome, {decoded.full_name}</h2>
        <p><strong>Email:</strong> {decoded.email}</p>
        <p><strong>Role:</strong> {decoded.role}</p>
      </div>
    </Layout>
  );
};

export default Profile;
