const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sql = require('mssql');
const { OAuth2Client } = require('google-auth-library');

// SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { Email, FullName, Password } = req.body;

    // Check if already exists
    const userResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT UserId FROM users WHERE Email = @Email');
    if (userResult.recordset[0]) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email credentials not configured' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await req.dbPool.request()
      .input('email', sql.NVarChar, Email)
      .input('otp', sql.NVarChar, otp)
      .query('INSERT INTO shortmessage (Email, Otp, CreatedAt) VALUES (@email, @otp, GETDATE())');

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: Email,
      subject: 'Your OTP for Registration',
      text: `Hi ${FullName}, your OTP is: ${otp}`,
    });

    res.status(200).json({ message: 'OTP sent successfully to email' });
  } catch (err) {
    console.error('Error in sendOtp:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// VERIFY OTP AND REGISTER
exports.verifyOtpAndRegister = async (req, res) => {
  try {
    const { FullName, Email, Password, otp, SSOLogin = 'N' } = req.body;

    const otpResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`
        SELECT TOP 1 Email, Otp
        FROM ShortMessage
        WHERE Email = @email
        ORDER BY CreatedAt DESC
      `);
    const otpRecord = otpResult.recordset[0];

    if (!otpRecord || otpRecord.Otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Fetch the default 'Users' role ID
    const roleResult = await req.dbPool.request()
      .input('Label', sql.NVarChar, 'Users')
      .query('SELECT RoleId FROM roles WHERE Label = @Label');
    if (!roleResult.recordset[0]) {
      return res.status(500).json({ error: 'Default user role not found' });
    }
    const RoleId = roleResult.recordset[0].RoleId;

    const hashedPassword = Password ? await bcrypt.hash(Password, 10) : null;

    await req.dbPool.request()
      .input('FullName', sql.NVarChar, FullName)
      .input('Email', sql.NVarChar, Email)
      .input('Password', sql.NVarChar, hashedPassword)
      .input('RoleId', sql.Int, RoleId)
      .input('SSOLogin', sql.Char(1), SSOLogin)
      .input('Joined', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO users (FullName, Email, Password, RoleId, SSOLogin, Joined, UpdatedAt)
        VALUES (@FullName, @Email, @Password, @RoleId, @SSOLogin, @Joined, @UpdatedAt)
      `);

    // Clean up OTP
    await req.dbPool.request()
      .input('email', sql.NVarChar, Email)
      .query('DELETE FROM shortmessage WHERE email = @email');

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error in verifyOtpAndRegister:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // Step 1: Fetch user by email with role information
    const userResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, Email)
      .query(`
        SELECT 
          u.UserId, 
          u.FullName, 
          u.Email, 
          u.Password, 
          u.UserLocked, 
          u.InvalidAttempt, 
          u.LockedDate,
          r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.Email = @Email
      `);
    const user = userResult.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Step 2: Check if user is locked
    if (user.UserLocked === 'Y') {
      return res.status(403).json({
        error: 'Your account is locked due to multiple failed login attempts. Please contact admin.',
      });
    }

    // Step 3: Validate password
    const isPasswordValid = await bcrypt.compare(Password, user.Password);

    if (!isPasswordValid) {
      // Increment invalid attempts
      const newAttemptCount = (user.InvalidAttempt || 0) + 1;
      const updates = {
        InvalidAttempt: newAttemptCount,
      };

      // If attempts >= 3 → lock the account
      if (newAttemptCount >= 3) {
        updates.UserLocked = 'Y';
        updates.LockedDate = new Date();
      }

      await req.dbPool.request()
        .input('UserId', sql.Int, user.UserId)
        .input('InvalidAttempt', sql.Int, updates.InvalidAttempt)
        .input('UserLocked', sql.Char(1), updates.UserLocked || user.UserLocked)
        .input('LockedDate', sql.DateTime, updates.LockedDate || null)
        .query(`
          UPDATE users
          SET 
            InvalidAttempt = @InvalidAttempt,
            UserLocked = @UserLocked,
            LockedDate = @LockedDate
          WHERE UserId = @UserId
        `);

      return res.status(401).json({
        error: newAttemptCount >= 3
          ? 'Account locked due to multiple failed attempts.'
          : 'Invalid email or password',
      });
    }

    // Step 4: Reset invalid attempts and update LastLogin
    await req.dbPool.request()
      .input('UserId', sql.Int, user.UserId)
      .input('InvalidAttempt', sql.Int, 0)
      .input('LastLogin', sql.DateTime, new Date())
      .query(`
        UPDATE users
        SET 
          InvalidAttempt = @InvalidAttempt,
          LastLogin = @LastLogin
        WHERE UserId = @UserId
      `);

    // Step 5: Generate JWT
    const token = jwt.sign(
      {
        id: user.UserId,
        fullname: user.FullName,
        email: user.Email,
        role: user.Label,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// SSO LOGIN
exports.ssoLogin = async (req, res) => {
  try {

    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No token provided in Authorization header');
      return res.status(401).json({ error: 'Missing token' });
    }

    // Initialize Google OAuth client
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      if (!payload.email) {
        console.error('Google token missing email');
        return res.status(401).json({ error: 'Invalid Google token: No email found' });
      }
    } catch (err) {
      console.error('Google Token Verification Error:', err.message);
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const user = {
      email: payload.email,
      user_metadata: { full_name: payload.name || payload.email },
    };

    // Fetch the default 'Users' role
    const roleResult = await req.dbPool.request()
      .input('Label', sql.NVarChar, 'Users')
      .query('SELECT RoleId, Label FROM roles WHERE Label = @Label');
    if (!roleResult.recordset[0]) {
      console.error('Default user role not found');
      return res.status(500).json({ error: 'Default user role not found' });
    }
    const { RoleId, Label: userRoleLabel } = roleResult.recordset[0];

    // Check if user exists in DB
    const userResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, user.email)
      .query(`
        SELECT 
          u.UserId, 
          u.FullName, 
          u.Email, 
          u.SSOLogin, 
          r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.Email = @Email
      `);
    let existingUser = userResult.recordset[0];

    let userId;
    let roleLabel = userRoleLabel;

    if (!existingUser) {
      // New User -> Create with SSOLogin = 'Y'
      const insertResult = await req.dbPool.request()
        .input('FullName', sql.NVarChar, user.user_metadata.full_name || user.email)
        .input('Email', sql.NVarChar, user.email)
        .input('Password', sql.NVarChar, '')
        .input('RoleId', sql.Int, RoleId)
        .input('SSOLogin', sql.Char(1), 'Y')
        .input('Joined', sql.DateTime, new Date())
        .input('UpdatedAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO users (FullName, Email, Password, RoleId, SSOLogin, Joined, UpdatedAt)
          OUTPUT INSERTED.UserId
          VALUES (@FullName, @Email, @Password, @RoleId, @SSOLogin, @Joined, @UpdatedAt)
        `);
      userId = insertResult.recordset[0].UserId;
    } else {
      if (existingUser.SSOLogin !== 'Y') {
        console.error('SSO login not allowed for user:', user.email);
        return res.status(403).json({ error: 'SSO login is not allowed for this user.' });
      }
      userId = existingUser.UserId;
      roleLabel = existingUser.Label;

      // Update LastLogin
      await req.dbPool.request()
        .input('UserId', sql.Int, userId)
        .input('LastLogin', sql.DateTime, new Date())
        .query(`
          UPDATE users
          SET LastLogin = @LastLogin
          WHERE UserId = @UserId
        `);
    }

    // Generate JWT
    const appToken = jwt.sign(
      { id: userId, fullname: user.user_metadata.full_name || user.email, email: user.email, role: roleLabel },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ token: appToken });
  } catch (err) {
    console.error('Error in ssoLogin:', err.message, err.stack);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Send OTP for Reset Password
exports.sendResetPasswordOtp = async (req, res) => {
  try {
    const { Email } = req.body;

    // Validate email presence
    if (!Email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT UserId FROM users WHERE Email = @Email');
    if (!userResult.recordset[0]) {
      return res.status(400).json({ error: 'Email not found' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email credentials not configured' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await req.dbPool.request()
      .input('email', sql.NVarChar, Email)
      .input('otp', sql.NVarChar, otp)
      .query('INSERT INTO shortmessage (email, otp, CreatedAt) VALUES (@email, @otp, GETDATE())');

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: Email,
      subject: 'Your OTP for Password Reset',
      text: `Hi, your OTP for resetting your password is: ${otp}`,
    });

    res.status(200).json({ message: 'OTP sent successfully to email' });
  } catch (err) {
    console.error('Error in sendResetPasswordOtp:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Verify OTP and Reset Password
exports.verifyResetPasswordOtp = async (req, res) => {
  try {
    const { Email, otp, NewPassword } = req.body;

    // Validate inputs
    if (!Email || !otp || !NewPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (NewPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Check if user exists
    const userResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT UserId FROM users WHERE Email = @Email');
    if (!userResult.recordset[0]) {
      return res.status(400).json({ error: 'Email not found' });
    }

    // Verify OTP
    const otpResult = await req.dbPool.request()
      .input('email', sql.NVarChar, Email)
      .input('otp', sql.NVarChar, otp)
      .query(`
        SELECT TOP 1 email, otp
        FROM shortmessage
        WHERE email = @email AND otp = @otp
        ORDER BY CreatedAt DESC
      `);
    if (!otpResult.recordset[0]) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(NewPassword, 10);

    // Update user's password
    await req.dbPool.request()
      .input('Email', sql.NVarChar, Email)
      .input('Password', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE users
        SET Password = @Password
        WHERE Email = @Email
      `);

    // Delete the used OTP
    await req.dbPool.request()
      .input('email', sql.NVarChar, Email)
      .input('otp', sql.NVarChar, otp)
      .query('DELETE FROM shortmessage WHERE email = @email AND otp = @otp');

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Error in verifyResetPasswordOtp:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

module.exports = exports;