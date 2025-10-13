const sql = require('mssql');
const sqlConfig = require('../config/db');

exports.getAllWaitlist = async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);

    const query = `
      WITH lastChange AS (
        SELECT ProductId, MAX(EventUtc) AS LastStatusChangeUtc
        FROM dbo.ProductStatusLog
        GROUP BY ProductId
      )
      SELECT
        w.UserEmail   AS email,
        v.ProductId   AS id,
        v.Name        AS name,
        v.Status      AS status,
        v.ImageUrl    AS imageUrl,
        ISNULL(v.LastUpdatedUtc, v.UpdatedAt) AS updated,
        CASE WHEN v.Status = 'Available' THEN lc.LastStatusChangeUtc ELSE NULL END AS availableSinceUtc
      FROM dbo.Waitlist w
      JOIN dbo.vProductsForWaitlist v ON v.ProductId = w.ProductId
      LEFT JOIN lastChange lc ON lc.ProductId = v.ProductId
      ORDER BY v.Name, w.UserEmail;
    `;

    const result = await pool.request().query(query);

    const formatted = result.recordset.map(r => ({
      email: r.email,
      id: r.id,
      name: r.name,
      status: r.status,
      imageUrl: r.imageUrl || null,
      updated: r.updated ? new Date(r.updated).toISOString() : null,
      availableSince: r.availableSinceUtc ? new Date(r.availableSinceUtc).getTime() : null
    }));

    res.json({
      total: formatted.length,
      waitlist: formatted
    });
  } catch (err) {
    console.error('getAllWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getWaitlist = async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const pool = await sql.connect(sqlConfig);
    const query = `
      WITH lastChange AS (
        SELECT ProductId, MAX(EventUtc) AS LastStatusChangeUtc
        FROM dbo.ProductStatusLog
        GROUP BY ProductId
      )
      SELECT
        v.ProductId  AS id,
        v.Name       AS name,
        v.Status     AS status,
        v.ImageUrl   AS imageUrl,
        ISNULL(v.LastUpdatedUtc, v.UpdatedAt) AS updated,
        CASE WHEN v.Status = 'Available' THEN lc.LastStatusChangeUtc ELSE NULL END AS availableSinceUtc
      FROM dbo.Waitlist w
      JOIN dbo.vProductsForWaitlist v ON v.ProductId = w.ProductId
      LEFT JOIN lastChange lc ON lc.ProductId = v.ProductId
      WHERE w.UserEmail = @Email
      ORDER BY v.Name;
    `;

    const result = await pool.request()
      .input('Email', sql.NVarChar, email)
      .query(query);

    const formatted = result.recordset.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      imageUrl: r.imageUrl || null,
      updated: r.updated ? new Date(r.updated).toISOString() : null,
      availableSince: r.availableSinceUtc ? new Date(r.availableSinceUtc).getTime() : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.addToWaitlist = async (req, res) => {
  try {
    const { productId, email } = req.body;
    if (!productId || !email)
      return res.status(400).json({ error: 'productId and email are required' });

    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('ProductId', sql.Int, productId)
      .input('Email', sql.NVarChar, email.trim().toLowerCase())
      .query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.Waitlist WHERE ProductId=@ProductId AND UserEmail=@Email)
          INSERT INTO dbo.Waitlist(ProductId, UserEmail) VALUES(@ProductId, @Email);
      `);

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('addToWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.removeFromWaitlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const email = (req.query.email || '').trim().toLowerCase();

    if (!email || !productId)
      return res.status(400).json({ error: 'email and productId are required' });

    const pool = await sql.connect(sqlConfig);
    await pool.request()
      .input('ProductId', sql.Int, Number(productId))
      .input('Email', sql.NVarChar, email)
      .query(`DELETE FROM dbo.Waitlist WHERE ProductId=@ProductId AND UserEmail=@Email;`);

    res.json({ ok: true });
  } catch (err) {
    console.error('removeFromWaitlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
