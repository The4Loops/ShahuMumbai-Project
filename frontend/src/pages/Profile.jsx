import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdEmail, MdPhone } from "react-icons/md";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import api from "../supabase/axios";
import Layout from "../layout/Layout";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import { useLoading } from "../context/LoadingContext";

// Moved outside to avoid useEffect dependency warning
const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  about: "",
  country: "",
  role: "",
  preferences: {
    newsletter: false,
    emailNotifications: false,
    publicProfile: false,
  },
  socialLinks: {
    twitter: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  },
  image: null,
};

// Toggle Switch Component
const Toggle = ({ enabled, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
      enabled ? "bg-green-500" : "bg-gray-300"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
        enabled ? "translate-x-6" : "translate-x-0"
      }`}
    />
  </button>
);

function Profile() {
  const { setLoading } = useLoading();
  const [profile, setProfile] = useState(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      setLoading(true);
      try {
        const response = await api.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { user } = response.data;

        let formattedJoined = "";
        if (user.Joined) {
          const [day, month, year] = user.Joined.split("/").map(Number);
          const parsedDate = new Date(year, month - 1, day);

          formattedJoined = parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }

        setProfile({
          name: user.FullName || "",
          email: user.Email || "",
          phone: user.Phone || "",
          about: user.About || "",
          country: user.Country || "",
          role: user.role || "",
          joined: formattedJoined || "",
          preferences: {
            newsletter: user.preferences?.newsletter === 'Y'? true : false || false,
            emailNotifications: user.preferences?.emailNotifications === 'Y'? true : false || false,
            publicProfile: user.preferences?.publicProfile === 'Y'? true : false || false,
          },
          socialLinks: {
            twitter: user.socialLinks?.twitter || "",
            facebook: user.socialLinks?.facebook || "",
            instagram: user.socialLinks?.instagram || "",
            linkedin: user.socialLinks?.linkedin || "",
          },
          image: user.image || null,
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile");
      }finally{
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate,setLoading]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/api/upload/single", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProfile((prev) => ({ ...prev, image: response.data.url }));
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Failed to upload image");
    }finally{
      setLoading(false);
    }
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      setLoading(true);
      try {
        const response = await api.put(
          "/api/edit-profile",
          {
            FullName: profile.name,
            Email: profile.email,
            Phone: profile.phone,
            About: profile.about,
            Country: profile.country,
            NewsLetterSubscription: profile.preferences.newsletter,
            EmailNotifications: profile.preferences.emailNotifications,
            PublicProfile: profile.preferences.publicProfile,
            TwitterUrl: profile.socialLinks.twitter,
            FacebookUrl: profile.socialLinks.facebook,
            InstagramUrl: profile.socialLinks.instagram,
            LinkedInUrl: profile.socialLinks.linkedin,
            ProfileImage: profile.image,
          }
        );
        const { user } = response.data;

        let formattedJoined = "";
        if (user.Joined) {
          const [day, month, year] = user.Joined.split("/").map(Number);
          const parsedDate = new Date(year, month - 1, day);

          formattedJoined = parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
        }

        setProfile({
          name: user.FullName || "",
          email: user.Email || "",
          phone: user.Phone || "",
          about: user.About || "",
          country: user.Country || "",
          joined: formattedJoined || "",
          role: user.role || "",
          preferences: {
            newsletter: user.preferences?.newsletter === 'Y'? true : false || false,
            emailNotifications: user.preferences?.emailNotifications === 'Y'? true : false || false,
            publicProfile: user.preferences?.publicProfile === 'Y'? true : false || false,
          },
          socialLinks: {
            twitter: user.socialLinks?.twitter || "",
            facebook: user.socialLinks?.facebook || "",
            instagram: user.socialLinks?.instagram || "",
            linkedin: user.socialLinks?.linkedin || "",
          },
          image: user.image || null,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast.dismiss();
        toast.success("Edit profile successfully");
      } catch (err) {
        console.error("Profile update failed:", err);
      }finally{
        setLoading(false);  
      }
    }
    setIsEditing(!isEditing);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);

  // ---------- SEO ----------
  // User profile pages are typically private — mark as noindex.
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://www.shahumumbai.com";
  const canonical = `${baseUrl}/profile`;

  return (
    <Layout>
      <Helmet>
        <title>My Profile — Shahu Mumbai</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <motion.div
        className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Summary */}
        <div className="col-span-1 text-center bg-[#F1E7E5] rounded-2xl shadow p-6 sm:col-span-1">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
            {profile.image ? (
              <img
                src={profile.image}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                {getInitials(profile.name || "U")}
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-black text-white rounded-full p-1 cursor-pointer text-xs">
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">{profile.name || "Unnamed User"}</h2>
          <span className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded-full mt-2 inline-block">
            {profile.role || "Collector"}
          </span>
          {isEditing ? (
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={profile.country}
              onChange={handleChange}
              className="mt-1 text-sm text-gray-500 bg-white border rounded px-2 py-1 w-full"
            />
          ) : (
            <p className="text-sm text-gray-500 mt-1">{profile.country || "Unknown Location"}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Member since {profile.joined}</p>
        </div>

        {/* Personal Info */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-semibold">Personal Information</h3>
            <button
              onClick={handleToggleEdit}
              className="bg-black text-white px-4 py-1 rounded text-sm w-full sm:w-auto"
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          </div>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Full Name"
              value={profile.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="border px-4 py-2 rounded w-full disabled:bg-gray-100"
            />
            <div className="flex items-center border px-4 py-2 rounded w-full">
              <MdEmail className="mr-2" />
              <input
                name="email"
                placeholder="Email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent outline-none disabled:bg-gray-100"
              />
            </div>
            <div className="flex items-center border px-4 py-2 rounded w-full">
              <MdPhone className="mr-2" />
              <input
                name="phone"
                placeholder="Phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-transparent outline-none disabled:bg-gray-100"
              />
            </div>
          </div>
          <textarea
            name="about"
            placeholder="Tell us about yourself..."
            value={profile.about}
            onChange={handleChange}
            disabled={!isEditing}
            className="mt-4 w-full border px-4 py-2 rounded disabled:bg-gray-100"
          />
          {saved && <p className="text-green-600 mt-2">Changes saved!</p>}
        </div>

        {/* Activity Stats */}
        <div className="col-span-1 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Activity Stats</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>Items Purchased: <strong>0</strong></li>
            <li>Wishlist Items: <strong>0</strong></li>
            <li>Reviews Written: <strong>0</strong></li>
          </ul>
        </div>

        {/* Preferences */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Preferences</h3>
          <div className="space-y-4">
            {[
              ["Newsletter Subscription", "newsletter"],
              ["Email Notifications", "emailNotifications"],
              ["Public Profile", "publicProfile"],
            ].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between">
                <span>{label}</span>
                <Toggle
                  enabled={profile.preferences[key]}
                  onChange={() =>
                    isEditing &&
                    setProfile((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        [key]: !prev.preferences[key],
                      },
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="col-span-1 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Social Links</h3>
          <div className="space-y-3">
            {[
              { label: "Twitter", key: "twitter", icon: <FaTwitter /> },
              { label: "Facebook", key: "facebook", icon: <FaFacebook /> },
              { label: "Instagram", key: "instagram", icon: <FaInstagram /> },
              { label: "LinkedIn", key: "linkedin", icon: <FaLinkedin /> },
            ].map(({ label, key, icon }) => (
              <div key={key} className="flex items-center gap-2">
                {icon}
                {isEditing ? (
                  <input
                    type="text"
                    placeholder={`${label} URL`}
                    value={profile.socialLinks[key]}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, [key]: e.target.value },
                      }))
                    }
                    className="border px-2 py-1 rounded w/full"
                  />
                ) : profile.socialLinks[key] ? (
                  <a
                    href={profile.socialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {profile.socialLinks[key]}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Link to="/wishlist" className="w-full sm:w-auto">
              <button className="w-full border px-4 py-2 rounded">View Wishlist</button>
            </Link>
            <Link to="/myorder" className="w-full sm:w-auto">
              <button className="w-full border px-4 py-2 rounded">Order History</button>
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded w-full md:w-auto"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </Layout>
  );
}

export default Profile;
