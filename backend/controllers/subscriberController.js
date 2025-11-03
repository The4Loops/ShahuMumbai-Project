const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sql = require('mssql');

// API: Get Users with Newsletter Subscription
exports.getSubscribeUser = async (req, res) => {
  try {
    // Fetch registered users with newsletter subscription
    const userResult = await req.db.request().query(`
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

    // Fetch pending subscriptions
    const subscriptionResult = await req.db.request().query(`
      SELECT 
        SubscriptionId AS id,
        Email AS email,
        CreatedAt AS joined,
        UpdatedAt AS updated_at
      FROM subscriptions
    `);

    const usersData = userResult.recordset;
    const subscriptionsData = subscriptionResult.recordset;

    if (!usersData && !subscriptionsData) {
      return res.status(400).json({ error: 'Error fetching subscribers' });
    }

    // Transform registered users data
    const transformedUsers = usersData.map((user) => ({
      id: user.id,
      full_name: user.full_name || 'N/A',
      email: user.email,
      phone: user.phone || '',
      about: user.about || '',
      country: user.country || '',
      preferences: {
        newsletter: user.newsletter_subscription === 'Y',
        emailNotifications: user.email_notifications === 'Y',
        publicProfile: user.public_profile === 'Y',
      },
      socialLinks: {
        twitter: user.twitter_url || '',
        facebook: user.facebook_url || '',
        instagram: user.instagram_url || '',
        linkedin: user.linkedin_url || '',
      },
      image: user.profile_image || null,
      role: user.Label || 'Subscriber',
      active: user.active === 'Y',
      joined: user.joined ? new Date(user.joined).toLocaleDateString() : 'N/A',
      last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      updated_date: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A',
      updated_time: user.updated_at ? new Date(user.updated_at).toLocaleTimeString() : 'N/A',
    }));

    // Transform subscription data for unregistered users
    const transformedSubscriptions = subscriptionsData.map((sub) => ({
      id: sub.id,
      full_name: 'N/A',
      email: sub.email,
      phone: '',
      about: '',
      country: '',
      preferences: {
        newsletter: true, // Assume newsletter preference since they subscribed
        emailNotifications: false,
        publicProfile: false,
      },
      socialLinks: {
        twitter: '',
        facebook: '',
        instagram: '',
        linkedin: '',
      },
      image: null,
      role: 'Pending Subscriber',
      active: false,
      joined: sub.joined ? new Date(sub.joined).toLocaleDateString() : 'N/A',
      last_login: 'Never',
      updated_date: sub.updated_at ? new Date(sub.updated_at).toLocaleDateString() : 'N/A',
      updated_time: sub.updated_at ? new Date(sub.updated_at).toLocaleTimeString() : 'N/A',
    }));

    // Combine both datasets
    const transformedData = [...transformedUsers, ...transformedSubscriptions];

    res.status(200).json({ users: transformedData });
  } catch (err) {
    console.error('getSubscribeUser:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
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
    const userResult = await req.db.request()
      .input('Email', sql.NVarChar, email)
      .query(`
        SELECT UserId, Email, NewsLetterSubscription
        FROM users
        WHERE Email = @Email
      `);

    const user = userResult.recordset[0];
    let updatedRecord;

    // Fetch email content from module table
    const moduleResult = await req.db.request()
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
    const transporter = nodemailer.createTransport({
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

    if (user) {
      // Existing user: Update newsletter subscription
      const updateResult = await req.db.request()
        .input('UserId', sql.Int, user.UserId)
        .input('NewsLetterSubscription', sql.Char(1), 'Y')
        .input('UpdatedAt', sql.DateTime, new Date().toISOString())
        .query(`
          UPDATE users
          SET NewsLetterSubscription = @NewsLetterSubscription, UpdatedAt = @UpdatedAt
          OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.NewsLetterSubscription
          WHERE UserId = @UserId
        `);

      updatedRecord = updateResult.recordset[0];
      if (!updatedRecord) {
        return res.status(400).json({ error: 'Failed to update newsletter subscription' });
      }
    } else {
      // New user: Insert into subscriptions table
      const insertResult = await req.db.request()
        .input('Email', sql.NVarChar, email)
        .input('CreatedAt', sql.DateTime, new Date().toISOString())
        .input('UpdatedAt', sql.DateTime, new Date().toISOString())
        .query(`
          INSERT INTO subscriptions (Email, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.SubscriptionId, INSERTED.Email
          VALUES (@Email, @CreatedAt, @UpdatedAt)
        `);

      updatedRecord = insertResult.recordset[0];
      if (!updatedRecord) {
        return res.status(400).json({ error: 'Failed to record subscription' });
      }
    }

    res.status(200).json({
      message: 'Newsletter email sent and subscription recorded',
      record: updatedRecord,
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
    const usersResult = await req.db.request()
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

exports.getNewsletterStatus = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET is set in env
    const userId = decoded.id; // Assuming 'id' is the UserId in token payload

    const userResult = await req.db.request()
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT NewsLetterSubscription, OptOutNewsletterPopup
        FROM users
        WHERE UserId = @UserId
      `);

    const user = userResult.recordset[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dontShow = user.NewsLetterSubscription === 'Y' || user.OptOutNewsletterPopup === 'Y';
    res.status(200).json({ dontShow });
  } catch (error) {
    console.error('getNewsletterStatus:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.optOutNewsletter = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    await req.db.request()
      .input('UserId', sql.Int, userId)
      .input('OptOutNewsletterPopup', sql.Char(1), 'Y')
      .input('UpdatedAt', sql.DateTime, new Date().toISOString())
      .query(`
        UPDATE users
        SET OptOutNewsletterPopup = @OptOutNewsletterPopup, UpdatedAt = @UpdatedAt
        WHERE UserId = @UserId
      `);

    res.status(200).json({ message: 'Opted out successfully' });
  } catch (error) {
    console.error('optOutNewsletter:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};