const sql = require("mssql");
const nodemailer = require('nodemailer');

// Create a new contact message
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message, status } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await req.db.request()
      .input("Name", sql.NVarChar, name)
      .input("Email", sql.NVarChar, email)
      .input("Subject", sql.NVarChar, subject)
      .input("Message", sql.NVarChar, message)
      .input("Status", sql.NVarChar, status || "pending")
      .input("CreatedAt", sql.DateTime, new Date())
      .query(`
        INSERT INTO ContactUs (Name, Email, Subject, Message, Status, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@Name, @Email, @Subject, @Message, @Status, @CreatedAt)
      `);

    const newContact = result.recordset[0];

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const adminMailOptions = {
      to: process.env.EMAIL_USER,
      subject: `User Query: ${subject}`,
      html: `
        <h2>User Query</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="background:#f9f9f9; padding:15px; border-left:4px solid #ccc;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
        <hr>
        <small>Sent on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small>
      `,
      text: `
      User Query

      Name: ${name}
      Email: ${email}
      Subject: ${subject}

      Message:
      ${message}

      Sent on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      `.trim(),
    };

    await transporter.sendMail(adminMailOptions);

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "We've Received Your Message – ShahU Mumbai",
      html: `
        <h2>Thank you, ${name}!</h2>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p><strong>Your Message:</strong></p>
        <blockquote style="background:#f0f8ff; padding:15px; border-left:4px solid #007bff;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
        <p>Need faster help? Call us at <strong>+1 (929)715-5118 and +91 9594545119</strong></p>
        <hr>
        <p>Best regards,<br><strong>Bhumi Shahu</strong><br>Founder, Shahu Mumbai</p>
      `,
    };

    await transporter.sendMail(userMailOptions);

   res.status(201).json({message: "Contact created and emails sent successfully",contact: newContact});
  } catch (e) {
    console.error("contact-us.createContact error", e);
    res.status(500).json({ error: "internal_error", details: e.message });
  }
};

// List all contact messages
exports.getAllContact = async (req, res) => {
  try {
    const {
      status = "All",
      q = "",
      limit: limitStr = "50",
      offset: offsetStr = "0",
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let query = `
      SELECT ContactUsId, Name, Email, Subject, Message, Status, CreatedAt
      FROM ContactUs
      WHERE 1=1
    `;

    if (status && status !== "All") {
      query += ` AND Status = @Status`;
    }
    if (q) {
      query += ` AND (Name LIKE @Search OR Email LIKE @Search)`;
    }

    query += ` ORDER BY CreatedAt DESC
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;

    const request = req.db.request()
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset);

    if (status && status !== "All") request.input("Status", sql.NVarChar, status.toLowerCase());
    if (q) request.input("Search", sql.NVarChar, `%${q}%`);

    const result = await request.query(query);
    res.json({ contacts: result.recordset, total: result.recordset.length });
  } catch (e) {
    console.error("contact-us.listContacts error", e);
    res.status(500).json({ error: "internal_error", details: e.message });
  }
};

// Get a single contact message by ID
exports.getContact = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input("Id", sql.Int, id)
      .query(`SELECT Id, Name, Email, Subject, Message, Status, CreatedAt FROM ContactUs WHERE Id = @Id`);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(result.recordset[0]);
  } catch (e) {
    console.error("contact-us.getContact error", e);
    res.status(500).json({ error: "internal_error", details: e.message });
  }
};

// Update a contact message by ID
exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, subject, message, status } = req.body;

    let updateFields = [];
    if (name) updateFields.push("Name = @Name");
    if (email) updateFields.push("Email = @Email");
    if (subject) updateFields.push("Subject = @Subject");
    if (message) updateFields.push("Message = @Message");
    if (status) updateFields.push("Status = @Status");

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const query = `
      UPDATE ContactUs
      SET ${updateFields.join(", ")}, UpdatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE ContactUsId = @Id
    `;

    const request = req.db.request().input("Id", sql.Int, id);
    if (name) request.input("Name", sql.NVarChar, name);
    if (email) request.input("Email", sql.NVarChar, email);
    if (subject) request.input("Subject", sql.NVarChar, subject);
    if (message) request.input("Message", sql.NVarChar, message);
    if (status) request.input("Status", sql.NVarChar, status);

    const result = await request.query(query);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Updated successfully", contact: result.recordset[0] });
  } catch (e) {
    console.error("contact-us.updateContact error", e);
    res.status(500).json({ error: "internal_error", details: e.message });
  }
};

// Delete a contact message by ID
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM ContactUs OUTPUT DELETED.* WHERE Id = @Id`);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("contact-us.deleteContact error", e);
    res.status(500).json({ error: "internal_error", details: e.message });
  }
};
