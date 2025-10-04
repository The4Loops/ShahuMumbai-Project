const sql = require('mssql');
const sqlConfig = require('../config/db');
const { getModuleTemplate, renderTemplate, htmlToText } = require('../db/moduleRepo');
const { sendMail } = require('../utils/mailer'); // keep this path if your mailer lives in utils/
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.subscribeAndWelcome = async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email required' });
    }

    const pool = req.dbPool || await sql.connect(sqlConfig);

    // upsert into dbo.InviteRequests by Email
    const find = await pool.request()
      .input('email', sql.NVarChar(320), email)
      .query(`SELECT TOP 1 Id FROM dbo.InviteRequests WHERE Email=@email;`);

    if (!find.recordset.length) {
      try {
        await pool.request()
          .input('email', sql.NVarChar(320), email)
          .input('fullName', sql.NVarChar(200), name || null)
          .input('source', sql.NVarChar(100), 'singlepage')
          .query(`
            INSERT INTO dbo.InviteRequests (Email, FullName, Source, Status)
            VALUES (@email, @fullName, @source, 1); -- 1=requested
          `);
      } catch (err) {
        // ignore duplicate key; rethrow other errors
        if (!(err && (err.number === 2627 || err.number === 2601))) throw err;
      }
    } else {
      // optional: touch UpdatedAt/Source when repeat request happens
      await pool.request()
        .input('email', sql.NVarChar(320), email)
        .input('source', sql.NVarChar(100), 'singlepage')
        .query(`
          UPDATE dbo.InviteRequests
          SET Source = @source
          WHERE Email = @email;
        `);
    }

    // fetch the email HTML from dbo.Module (MailType='welcome_invite')
    const tpl = await getModuleTemplate('welcome_invite');
    if (!tpl) {
      return res.status(500).json({ ok: false, error: 'Template welcome_invite not found in dbo.Module' });
    }

    const subject = renderTemplate(tpl.MailSubject || 'Welcome', { name, email });
    const html    = renderTemplate(tpl.MailDescription || '<p>Welcome</p>', { name, email });
    const text    = htmlToText(html);

    const info = await sendMail({ to: email, subject, html, text });

    // mark as emailed and stamp time
    await pool.request()
      .input('email', sql.NVarChar(320), email)
      .query(`
        UPDATE dbo.InviteRequests
        SET Status = 2,               -- 2=emailed
            LastEmailAt = SYSUTCDATETIME()
        WHERE Email = @email;
      `);

    return res.status(201).json({ ok: true, mailId: info?.messageId || null });
  } catch (e) {
    console.error('[standaloneController.subscribeAndWelcome]', e);
    return res.status(500).json({ ok: false, error: e.message || 'Internal error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // Validate input
    if (!Email || !Password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Fetch user by email with role information
    const userResult = await req.dbPool.request()
      .input('email', sql.NVarChar, Email)
      .query(`
        SELECT 
          u.UserId, 
          u.FullName, 
          u.Email, 
          u.Password, 
          r.Label
        FROM users u
        INNER JOIN roles r ON u.RoleId = r.RoleId
        WHERE u.Email = @email
      `);
    
    const user = userResult.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(Password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user has Admin role
    if (user.Label !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    // Generate JWT
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

exports.getInviteRequests = async (req, res) => {
  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check if user has Admin role
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    // Fetch all records from InviteRequests table
    const result = await req.dbPool.request().query(`
      SELECT 
        Id,
        Email,
        FullName,
        Source,
        Status,
        Note,
        CreatedAt,
        UpdatedAt,
        LastEmailAt,
        InvitedAt
      FROM InviteRequests
    `);

    res.status(200).json({
      inviteRequests: result.recordset,
    });
  } catch (err) {
    console.error('Error fetching invite requests:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};