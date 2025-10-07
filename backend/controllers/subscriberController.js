const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sql = require('mssql');

// API: Get Users with Newsletter Subscription
exports.getSubscribeUser = async (req, res) => {
  try {
    const result = await req.dbPool.request()
      .query(`
        SELECT 
          UserId AS id,
          FullName AS full_name,
          Email AS email,
          Phone AS phone,
          About AS about,
          Country AS country,
          NewsLetterSubscription AS newsletter_subscription,
          EmailNotifications AS email_notifications,
          PublicProfile AS public_profile,
          TwitterUrl AS twitter_url,
          FacebookUrl AS facebook_url,
          InstagramUrl AS instagram_url,
          LinkedInUrl AS linkedin_url,
          ProfileImage AS profile_image,
          r.RoleId,
          Active AS active,
          Joined AS joined,
          LastLogin AS last_login,
          u.UpdatedAt AS updated_at,
          r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.NewsLetterSubscription = 'Y'
      `);

    const data = result.recordset;
    if (!data) {
      return res.status(400).json({ error: 'Error fetching subscribers' });
    }

    const transformedData = data.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      about: user.about,
      country: user.country,
      preferences: {
        newsletter: user.newsletter_subscription ==='Y'? true : false,
        emailNotifications: user.email_notifications ==='Y'? true : false,
        publicProfile: user.public_profile ==='Y'? true : false,
      },
      socialLinks: {
        twitter: user.twitter_url || '',
        facebook: user.facebook_url || '',
        instagram: user.instagram_url || '',
        linkedin: user.linkedin_url || '',
      },
      image: user.profile_image || null,
      role: user.Label,
      active: user.active === 'Y',
      joined: user.joined ? new Date(user.joined).toLocaleDateString() : 'N/A',
      last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      updated_date: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A',
      updated_time: user.updated_at ? new Date(user.updated_at).toLocaleTimeString() : 'N/A',
    }));

    res.status(200).json({ users: transformedData });
  } catch (err) {
    console.error('getSubscribeUser:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('UserId', sql.Int, id)
      .input('NewsLetterSubscription', sql.Char(1),'N')
      .input('UpdatedAt', sql.DateTime, new Date().toISOString())
      .query(`
        UPDATE users
        SET NewsLetterSubscription = @NewsLetterSubscription, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.UserId, INSERTED.FullName, INSERTED.Email, INSERTED.NewsLetterSubscription
        WHERE UserId = @UserId
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User newsletter subscription disabled', user: data });
  } catch (err) {
    console.error('deleteUser:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendSubscriberMail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fetch user to verify existence
    const userResult = await req.dbPool.request()
      .input('Email', sql.NVarChar, email)
      .query(`
        SELECT UserId, Email, NewsLetterSubscription
        FROM users
        WHERE Email = @Email
      `);

    const user = userResult.recordset[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch email content from module table
    const moduleResult = await req.dbPool.request()
      .input('mailtype', sql.NVarChar, 'Subscriber')
      .query('SELECT mailsubject, maildescription FROM module WHERE mailtype = @mailtype');

    const module = moduleResult.recordset[0];
    if (!module) {
      return res.status(400).json({ error: 'Subscriber email template not found' });
    }

    // Replace #username with email in maildescription
    const mailContent = module.maildescription.replace('#username', email);

    const plainTextContent = mailContent
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Send email
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
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
    const updateResult = await req.dbPool.request()
      .input('UserId', sql.Int, user.UserId)
      .input('NewsLetterSubscription', sql.Chat(1),'Y')
      .input('UpdatedAt', sql.DateTime, new Date().toISOString())
      .query(`
        UPDATE users
        SET NewsLetterSubscription = @NewsLetterSubscription, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.NewsLetterSubscription
        WHERE UserId = @UserId
      `);

    const updatedUser = updateResult.recordset[0];
    if (!updatedUser) {
      return res.status(400).json({ error: 'Failed to update newsletter subscription' });
    }

    res.status(200).json({
      message: 'Newsletter email sent and subscription enabled',
      user: updatedUser,
    });
  } catch (error) {
    console.error('sendSubscriberMail:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.sendNewsletterMail = async (req, res) => {
  try {
    const { subject, htmlContent } = req.body;
    
    if (!subject || !htmlContent) {
      return res.status(400).json({ error: 'Subject and HTML content are required' });
    }

    // Fetch users with newsletter_subscription: true
    const usersResult = await req.dbPool.request()
      .query(`SELECT Email FROM users WHERE NewsLetterSubscription ='Y'  `);

    const users = usersResult.recordset;
    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'No subscribers found' });
    }

    // Create plain text fallback by stripping HTML tags
    const plainTextContent = htmlContent
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email to each subscriber
    const emailPromises = users.map((user) =>
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.Email,
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
    console.error('sendNewsletterMail:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};