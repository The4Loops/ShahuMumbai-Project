const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");
const { encryptData } = require("../utils/crypto");

// SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { email, full_name, password } = req.body;

    // Check if already exists
    const { data: existingUser } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase.from("ShortMessage").insert([{ email, otp }]);

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Registration",
      text: `Hi ${full_name}, your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent successfully to email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// VERIFY OTP AND REGISTER
exports.verifyOtpAndRegister = async (req, res) => {
  try {
    const { full_name, email, password, otp, ssologin = "N" } = req.body;

    const { data: otpRecord } = await supabase
      .from("ShortMessage")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const { error } = await supabase.from("Users").insert([
      {
        full_name,
        email,
        password: hashedPassword,
        role: "user",
        ssologin,
      },
    ]);

    if (error) return res.status(400).json({ error: error.message });

    // Clean up OTP
    await supabase.from("ShortMessage").delete().eq("email", email);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Fetch user by email
    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ error: "Invalid email or password" });

    // Step 2: Check if user is locked
    if (user.userlocked === "Y") {
      return res.status(403).json({
        error:
          "Your account is locked due to multiple failed login attempts. Please contact admin.",
      });
    }

    // Step 3: Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment invalid attempts
      const newAttemptCount = (user.InvalidAttempt || 0) + 1;

      const updates = {
        InvalidAttempt: newAttemptCount,
      };

      // If attempts > 3 → lock the account
      if (newAttemptCount >= 3) {
        updates.userlocked = "Y";
        updates.lockeddate = new Date().toISOString();

        // Send alert email
        const { sendMail } = require("../utils/mailer");
        await sendMail(
          user.email,
          "Account Locked Due to Multiple Failed Logins",
          `<p>Dear ${user.full_name},</p>
     <p>Your account has been locked after multiple failed login attempts.</p>
     <p>Please contact the administrator to unlock your account.</p>`
        );
      }

      await supabase.from("Users").update(updates).eq("id", user.id);

      return res.status(401).json({
        error:
          newAttemptCount >= 3
            ? "Account locked due to multiple failed attempts."
            : "Invalid email or password",
      });
    }

    // Step 4: Reset InvalidAttempt count on successful login
    await supabase
      .from("Users")
      .update({ InvalidAttempt: 0 })
      .eq("id", user.id);

    // Step 5: Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SSO LOGIN
exports.ssoLogin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user)
      return res.status(401).json({ error: "Invalid Supabase token" });

    // Check if user exists in your DB
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!existingUser) {
      await supabase.from("users").insert([
        {
          full_name: user.user_metadata.full_name || user.email,
          email: user.email,
          password: "",
          role: "user",
          ssologin: "Y",
        },
      ]);
    }

    // Create your app JWT
    const appToken = jwt.sign(
      { id: user.id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token: appToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
