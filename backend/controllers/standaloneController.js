const sql = require('mssql');
const sqlConfig = require('../config/db');
const { getModuleTemplate, renderTemplate, htmlToText } = require('../db/moduleRepo');
const { sendMail } = require('../utils/mailer'); // keep this path if your mailer lives in utils/

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
