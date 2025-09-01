const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");

// API: Get Users with Newsletter Subscription
exports.getSubscribeUser = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, full_name, email, phone, about, country, newsletter_subscription, email_notifications, public_profile, twitter_url, facebook_url, instagram_url, linkedin_url, profile_image, roles!role_id(label), active, joined, last_login, updated_at"
      )
      .eq("newsletter_subscription", true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const transformedData = data.map((user) => ({
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
      last_login: user.last_login
        ? new Date(user.last_login).toLocaleDateString()
        : "Never",
      updated_date: user.updated_at
        ? new Date(user.updated_at).toLocaleDateString()
        : "N/A",
      updated_time: user.updated_at
        ? new Date(user.updated_at).toLocaleTimeString()
        : "N/A",
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
        updated_at: new Date().toISOString(),
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

    res
      .status(200)
      .json({ message: "User newsletter subscription disabled", user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendSubscriberMail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Fetch user to verify existence
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, newsletter_subscription")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch email content from module table
    const { data: module, error: moduleError } = await supabase
      .from("module")
      .select("mailsubject, maildescription")
      .eq("mailtype", "Subscriber")
      .single();

    if (moduleError || !module) {
      return res
        .status(400)
        .json({ error: "Subscriber email template not found" });
    }

    // Replace #username with email in maildescription
    const mailContent = module.maildescription.replace("#username", email);

    const plainTextContent = mailContent
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: module.mailsubject,
      html: mailContent,
      text: plainTextContent,
    };

    await transporter.sendMail(mailOptions);

    // Update user's newsletter_subscription to true
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        newsletter_subscription: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, email, newsletter_subscription")
      .single();

    if (updateError) {
      return res
        .status(400)
        .json({ error: "Failed to update newsletter subscription" });
    }

    res.status(200).json({
      message: "Newsletter email sent and subscription enabled",
      user: updatedUser,
    });
  } catch (error) {
    console.error("sendNewsletterEmail error", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.sendNewsletterMail = async (req, res) => {
  try {
    const { subject, htmlContent } = req.body;
    
    if (!subject || !htmlContent) {
      return res
        .status(400)
        .json({ error: "Subject and HTML content are required" });
    }

    // Fetch users with newsletter_subscription: true
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("email")
      .eq("newsletter_subscription", true);

    if (usersError) {
      return res.status(400).json({ error: usersError.message });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No subscribers found" });
    }

    // Create plain text fallback by stripping HTML tags
    const plainTextContent = htmlContent
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email to each subscriber
    const emailPromises = users.map((user) =>
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject,
        html: htmlContent,
        text: plainTextContent,
      })
    );
    
    await Promise.all(emailPromises);

    res.status(200).json({
      message: `Newsletter sent to ${users.length} subscriber(s)`,
    });
  } catch (error) {
    console.error("sendNewsletter error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
