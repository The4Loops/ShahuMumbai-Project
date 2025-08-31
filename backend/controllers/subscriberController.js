const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");

// API: Get Users with Newsletter Subscription
exports.getNewsletterUsers = async (req, res) => {

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, phone, about, country, newsletter_subscription, email_notifications, public_profile, twitter_url, facebook_url, instagram_url, linkedin_url, profile_image, roles!role_id(label), active, joined, last_login, updated_at")
      .eq("newsletter_subscription", true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const transformedData = data.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      about: user.about,
      country: user.country,
      preferences: {
        newsletter: user.newsletter_subscription,
        emailNotifications: user.email_notifications,
        publicProfile: user.public_profile,
      },
      socialLinks: {
        twitter: user.twitter_url || "",
        facebook: user.facebook_url || "",
        instagram: user.instagram_url || "",
        linkedin: user.linkedin_url || "",
      },
      image: user.profile_image || null,
      role: user.roles.label,
      active: user.active === "Y",
      joined: user.joined ? new Date(user.joined).toLocaleDateString() : "N/A",
      last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never",
      updated_date: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "N/A",
      updated_time: user.updated_at ? new Date(user.updated_at).toLocaleTimeString() : "N/A",
    }));

    res.status(200).json({ users: transformedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .update({ 
        newsletter_subscription: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id, full_name, email, newsletter_subscription")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User newsletter subscription disabled", user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};