const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");
const { encryptData } = require("../utils/crypto");

// VERIFY ADMIN
const verifyAdmin = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return { error: "Forbidden: Admins only" };
    return { decoded };
  } catch (err) {
    return { error: "Invalid Token" };
  }
};

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

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res
        .status(500)
        .json({ error: "Email credentials not configured" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { error } = await supabase
      .from("shortmessage")
      .insert([{ email, otp }]);

    if (error) {
      console.error("Insert OTP Error:", error);
      return res.status(500).json({ error: error.message });
    }

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
      .from("shortmessage")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const { error } = await supabase.from("users").insert([
      {
        full_name,
        email,
        password: hashedPassword,
        role: "user",
        ssologin,
        joined: new Date().toISOString(), // Set joined to current timestamp
      },
    ]);

    if (error) return res.status(400).json({ error: error.message });

    // Clean up OTP
    await supabase.from("shortmessage").delete().eq("email", email);

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
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!user || error) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

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
      const newAttemptCount = (user.invalidattempt || 0) + 1;

      const updates = {
        invalidattempt: newAttemptCount,
      };

      // If attempts >= 3 → lock the account
      if (newAttemptCount >= 3) {
        updates.userlocked = "Y";
        updates.lockeddate = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to update invalid attempts:", updateError.message);
      }

      return res.status(401).json({
        error:
          newAttemptCount >= 3
            ? "Account locked due to multiple failed attempts."
            : "Invalid email or password",
      });
    }

    // Step 4: Reset invalid attempts and update last_login
    const { error: updateError } = await supabase
      .from("users")
      .update({
        invalidattempt: 0,
        last_login: new Date().toISOString(), // Update last_login
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update user data:", updateError.message);
    }

    // Step 5: Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        fullname: user.full_name,
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
    const { data: existingUser, error: userFetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (userFetchError) {
      return res.status(500).json({ error: userFetchError.message });
    }

    let userId;
    let userRole = "user";

    if (!existingUser) {
      // New User -> Create with ssologin = Y and joined timestamp
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            full_name: user.user_metadata.full_name || user.email,
            email: user.email,
            password: "",
            role: "user",
            ssologin: "Y",
            joined: new Date().toISOString(), // Set joined for new user
          },
        ])
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
      userId = newUser.id;
    } else {
      if (existingUser.ssologin !== "Y") {
        return res.status(403).json({ error: "SSO login is not allowed for this user." });
      }
      userId = existingUser.id;
      userRole = existingUser.role;

      // Update last_login for existing user
      const { error: updateError } = await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to update last_login:", updateError.message);
      }
    }

    const appToken = jwt.sign(
      { id: userId, fullname: user.user_metadata.full_name || user.email, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ token: appToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

