const express = require('express');
const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// VERIFY ADMIN
const verifyAdmin = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { error: 'Unauthorized: Token missing' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return { error: 'Forbidden: Admins only' };
    return { decoded };
  } catch (err) {
    return { error: 'Invalid Token' };
  }
};

// Verify User
const verifyUser = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { error: 'Unauthorized: Token missing' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { decoded };
  } catch (err) {
    return { error: 'Invalid Token' };
  }
};

// ADMIN API: Create User
exports.adminCreateUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

  try {
    const { FullName, Email, Password, role, Active } = req.body;

    if (!FullName || !Email) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    // Fetch the RoleId from roles table
    const roleResult = await req.dbPool.request()
      .input('Label', sql.NVarChar, role || 'user')
      .query('SELECT RoleId FROM roles WHERE Label = @Label');
    if (!roleResult.recordset[0]) {
      return res.status(400).json({ error: `Role '${role || 'user'}' not found` });
    }
    const RoleId = roleResult.recordset[0].RoleId;

    const hashedPassword = Password ? await bcrypt.hash(Password, 10) : null;

    const result = await req.dbPool.request()
      .input('FullName', sql.NVarChar, FullName)
      .input('Email', sql.NVarChar, Email)
      .input('Password', sql.NVarChar, hashedPassword)
      .input('RoleId', sql.Int, RoleId)
      .input('Active', sql.Char(1), Active ? 'Y' : 'N')
      .input('Joined', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO users (FullName, Email, Password, RoleId, Active, Joined, UpdatedAt)
        OUTPUT 
          INSERTED.UserId, 
          INSERTED.FullName, 
          INSERTED.Email, 
          INSERTED.Password, 
          INSERTED.RoleId, 
          INSERTED.Active, 
          INSERTED.Joined, 
          r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.UserId = INSERTED.UserId
      `);

    if (!result.recordset[0]) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    const data = result.recordset[0];
    data.Active = data.Active === 'Y';
    data.roles = { Label: data.Label };
    delete data.Label;

    res.status(201).json({ message: 'User created successfully', user: data });
  } catch (err) {
    console.error('Error in adminCreateUser:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

  try {
    const { search, role, status, excludeRole } = req.query;

    let query = `
      SELECT 
        u.UserId, 
        u.FullName, 
        u.Email, 
        r.Label, 
        u.Active, 
        u.Joined, 
        u.LastLogin
      FROM users u
      INNER JOIN roles r ON u.RoleId = r.RoleId
    `;
    const parameters = [];

    // Search by FullName or Email
    if (search) {
      query += ` WHERE (u.FullName LIKE @search OR u.Email LIKE @search)`;
      parameters.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }

    // Filter by role
    if (role && role !== 'All') {
      const roleResult = await req.dbPool.request()
        .input('Label', sql.NVarChar, role)
        .query('SELECT RoleId FROM roles WHERE Label = @Label');
      if (!roleResult.recordset[0]) {
        return res.status(400).json({ error: `Role '${role}' not found` });
      }
      query += (search ? ' AND' : ' WHERE') + ' u.RoleId = @RoleId';
      parameters.push({ name: 'RoleId', type: sql.Int, value: roleResult.recordset[0].RoleId });
    }

    // Filter by status
    if (status && status !== 'All') {
      query += (search || (role && role !== 'All') ? ' AND' : ' WHERE') + ' u.Active = @Active';
      parameters.push({ name: 'Active', type: sql.Char(1), value: status === 'active' ? 'Y' : 'N' });
    }

    // Exclude specific role
    if (excludeRole) {
      const excludeRoleResult = await req.dbPool.request()
        .input('exclude_Label', sql.NVarChar, excludeRole)
        .query('SELECT RoleId FROM roles WHERE Label = @exclude_Label');
      if (!excludeRoleResult.recordset[0]) {
        return res.status(400).json({ error: `Exclude role '${excludeRole}' not found` });
      }
      query += ((search || (role && role !== 'All') || (status && status !== 'All')) ? ' AND' : ' WHERE') + ' u.RoleId != @excludeRoleId';
      parameters.push({ name: 'excludeRoleId', type: sql.Int, value: excludeRoleResult.recordset[0].RoleId });
    }

    const request = req.dbPool.request();
    parameters.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    const result = await request.query(query);
    const transformedData = result.recordset.map(user => ({
      ...user,
      role: user.Label,
      Active: user.Active === 'Y',
      Joined: user.Joined ? new Date(user.Joined).toLocaleDateString() : 'N/A',
      LastLogin: user.LastLogin ? new Date(user.LastLogin).toLocaleDateString() : 'Never',
      roles: { Label: user.Label }
    }));

    res.status(200).json({ users: transformedData });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

  try {
    const { UserId } = req.params;
    const { FullName, Email, Password, role, Active } = req.body;

    if (!FullName || !Email) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    // Fetch the RoleId from roles table
    const roleResult = await req.dbPool.request()
      .input('Label', sql.NVarChar, role || 'Users')
      .query('SELECT RoleId FROM roles WHERE Label = @Label');
    if (!roleResult.recordset[0]) {
      return res.status(400).json({ error: `Role '${role || 'Users'}' not found` });
    }
    const RoleId = roleResult.recordset[0].RoleId;

    const updates = {
      FullName,
      Email,
      RoleId,
      Active: Active ? 'Y' : 'N',
      UpdatedAt: new Date()
    };

    if (Password) {
      updates.Password = await bcrypt.hash(Password, 10);
    }

    const request = req.dbPool.request()
      .input('UserId', sql.Int, UserId)
      .input('FullName', sql.NVarChar, updates.FullName)
      .input('Email', sql.NVarChar, updates.Email)
      .input('RoleId', sql.Int, updates.RoleId)
      .input('Active', sql.Char(1), updates.Active)
      .input('UpdatedAt', sql.DateTime, updates.UpdatedAt);

    if (updates.Password) {
      request.input('Password', sql.NVarChar, updates.Password);
    }

    const result = await request.query(`
      UPDATE users
      SET 
        FullName = @FullName,
        Email = @Email,
        RoleId = @RoleId,
        Active = @Active,
        UpdatedAt = @UpdatedAt
        ${updates.Password ? ', Password = @Password' : ''}
      OUTPUT 
        INSERTED.UserId, 
        INSERTED.FullName, 
        INSERTED.Email, 
        INSERTED.Password, 
        INSERTED.RoleId, 
        INSERTED.Active, 
        INSERTED.Joined, 
        INSERTED.LastLogin,
        r.Label
      FROM users u
      INNER JOIN roles r ON u.RoleId = r.RoleId
      WHERE u.UserId = @UserId
    `);

    if (!result.recordset[0]) {
      return res.status(400).json({ error: 'User not found' });
    }

    const data = result.recordset[0];
    data.Active = data.Active === 'Y';
    data.roles = { Label: data.Label };
    delete data.Label;

    res.status(200).json({ message: 'User updated successfully', user: data });
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

  try {
    const { UserId } = req.params;

    const result = await req.dbPool.request()
      .input('UserId', sql.Int, UserId)
      .query(`
        DELETE FROM users
        WHERE UserId = @UserId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// API: Update User Profile
exports.updateUserProfile = async (req, res) => {
  const { error: authError, decoded } = verifyUser(req);
  if (authError) return res.status(401).json({ error: authError });

  try {
    const {
      FullName,
      Email,
      Password,
      Phone,
      About,
      Country,
      NewsLetterSubscription,
      EmailNotifications,
      PublicProfile,
      TwitterUrl,
      FacebookUrl,
      InstagramUrl,
      LinkedInUrl,
      ProfileImage,
    } = req.body;

    // Validate Email is provided
    if (!Email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fetch current user data to check NewsLetterSubscription status
    const currentUserResult = await req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .query('SELECT NewsLetterSubscription FROM users WHERE UserId = @UserId');
    if (!currentUserResult.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {
      FullName: FullName || null,
      Email,
      Phone: Phone || null,
      About: About || null,
      Country: Country || null,
      NewsLetterSubscription: NewsLetterSubscription ?? false,
      EmailNotifications: EmailNotifications ?? false,
      PublicProfile: PublicProfile ?? false,
      TwitterUrl: TwitterUrl || null,
      FacebookUrl: FacebookUrl || null,
      InstagramUrl: InstagramUrl || null,
      LinkedInUrl: LinkedInUrl || null,
      ProfileImage: ProfileImage || null,
      UpdatedAt: new Date(),
    };

    // Hash Password if provided
    if (Password) {
      updates.Password = await bcrypt.hash(Password, 10);
    }

    // Check if NewsLetterSubscription is changing from false to true
    const isFirstTimeSubscription =
      currentUserResult.recordset[0].NewsLetterSubscription === 0 &&
      updates.NewsLetterSubscription === true;

    // Send newsletter email if it's the first time subscription
    if (isFirstTimeSubscription) {
      // Fetch email content from module table
      const moduleResult = await req.dbPool.request()
        .input('mailtype', sql.NVarChar, 'Subscriber')
        .query('SELECT mailsubject, maildescription FROM module WHERE mailtype = @mailtype');
      if (!moduleResult.recordset[0]) {
        return res.status(400).json({ error: 'Subscriber email template not found' });
      }

      const { mailsubject, maildescription } = moduleResult.recordset[0];

      // Replace #username with Email in maildescription
      const mailContent = maildescription.replace('#username', Email);
      const plainTextContent = mailContent
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: Email,
        subject: mailsubject,
        html: mailContent,
        text: plainTextContent,
      };

      await transporter.sendMail(mailOptions);
    }

    // Update user in MSSQL
    const request = req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .input('FullName', sql.NVarChar, updates.FullName)
      .input('Email', sql.NVarChar, updates.Email)
      .input('Phone', sql.NVarChar, updates.Phone)
      .input('About', sql.NVarChar, updates.About)
      .input('Country', sql.NVarChar, updates.Country)
      .input('NewsLetterSubscription', sql.Char, updates.NewsLetterSubscription)
      .input('EmailNotifications', sql.Char, updates.EmailNotifications)
      .input('PublicProfile', sql.Char, updates.PublicProfile)
      .input('TwitterUrl', sql.NVarChar, updates.TwitterUrl)
      .input('FacebookUrl', sql.NVarChar, updates.FacebookUrl)
      .input('InstagramUrl', sql.NVarChar, updates.InstagramUrl)
      .input('LinkedInUrl', sql.NVarChar, updates.LinkedInUrl)
      .input('ProfileImage', sql.NVarChar, updates.ProfileImage)
      .input('UpdatedAt', sql.DateTime, updates.UpdatedAt);

    if (updates.Password) {
      request.input('Password', sql.NVarChar, updates.Password);
    }

    const result = await request.query(`
      UPDATE users
      SET 
        FullName = @FullName,
        Email = @Email,
        Phone = @Phone,
        About = @About,
        Country = @Country,
        NewsLetterSubscription = @NewsLetterSubscription,
        EmailNotifications = @EmailNotifications,
        PublicProfile = @PublicProfile,
        TwitterUrl = @TwitterUrl,
        FacebookUrl = @FacebookUrl,
        InstagramUrl = @InstagramUrl,
        LinkedInUrl = @LinkedInUrl,
        ProfileImage = @ProfileImage,
        UpdatedAt = @UpdatedAt
        ${updates.Password ? ', Password = @Password' : ''}
      OUTPUT 
        INSERTED.UserId, 
        INSERTED.FullName, 
        INSERTED.Email, 
        INSERTED.Phone, 
        INSERTED.About, 
        INSERTED.Country, 
        INSERTED.NewsLetterSubscription, 
        INSERTED.EmailNotifications, 
        INSERTED.PublicProfile, 
        INSERTED.TwitterUrl, 
        INSERTED.FacebookUrl, 
        INSERTED.InstagramUrl, 
        INSERTED.LinkedInUrl, 
        INSERTED.ProfileImage, 
        INSERTED.RoleId, 
        INSERTED.Active, 
        INSERTED.Joined, 
        INSERTED.LastLogin,
        r.Label
      FROM users u
      INNER JOIN roles r ON u.RoleId = r.RoleId
      WHERE u.UserId = @UserId
    `);

    if (!result.recordset[0]) {
      return res.status(400).json({ error: 'User not found' });
    }

    const data = result.recordset[0];
    const transformedData = {
      UserId: data.UserId,
      FullName: data.FullName,
      Email: data.Email,
      Phone: data.Phone,
      About: data.About,
      Country: data.Country,
      preferences: {
        newsletter: data.NewsLetterSubscription,
        emailNotifications: data.EmailNotifications,
        publicProfile: data.PublicProfile,
      },
      socialLinks: {
        twitter: data.TwitterUrl || '',
        facebook: data.FacebookUrl || '',
        instagram: data.InstagramUrl || '',
        linkedin: data.LinkedInUrl || '',
      },
      image: data.ProfileImage || null,
      role: data.Label,
      Active: data.Active === 'Y',
      Joined: data.Joined ? new Date(data.Joined).toLocaleDateString() : 'N/A',
      LastLogin: data.LastLogin ? new Date(data.LastLogin).toLocaleDateString() : 'Never',
    };

    res.status(200).json({ message: 'Profile updated successfully', user: transformedData });
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// API: Get User Profile
exports.getUserProfile = async (req, res) => {
  const { error: authError, decoded } = verifyUser(req);
  if (authError) return res.status(401).json({ error: authError });

  try {
    const result = await req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .query(`
        SELECT 
          u.UserId, 
          u.FullName, 
          u.Email, 
          u.Phone, 
          u.About, 
          u.Country, 
          u.NewsLetterSubscription, 
          u.EmailNotifications, 
          u.PublicProfile, 
          u.TwitterUrl, 
          u.FacebookUrl, 
          u.InstagramUrl, 
          u.LinkedInUrl, 
          u.ProfileImage, 
          u.RoleId, 
          u.Active, 
          u.Joined, 
          u.LastLogin,
          r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.UserId = @UserId
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = result.recordset[0];
    const transformedData = {
      UserId: data.UserId,
      FullName: data.FullName,
      Email: data.Email,
      Phone: data.Phone,
      About: data.About,
      Country: data.Country,
      preferences: {
        newsletter: data.NewsLetterSubscription || false,
        emailNotifications: data.EmailNotifications || false,
        publicProfile: data.PublicProfile || false,
      },
      socialLinks: {
        twitter: data.TwitterUrl || '',
        facebook: data.FacebookUrl || '',
        instagram: data.InstagramUrl || '',
        linkedin: data.LinkedInUrl || '',
      },
      image: data.ProfileImage || null,
      role: data.Label,
      Active: data.Active === 'Y',
      Joined: data.Joined ? new Date(data.Joined).toLocaleDateString() : 'N/A',
      LastLogin: data.LastLogin ? new Date(data.LastLogin).toLocaleDateString() : 'Never',
    };

    res.status(200).json({ user: transformedData });
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

module.exports = exports;