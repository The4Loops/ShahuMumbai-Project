const sql = require('mssql');
const jwt = require('jsonwebtoken');
const currentCartOwner = require('../utils/currentCartOwner');
const nodemailer = require('nodemailer');

/* GET /api/orders?status=All|Pending|Shipped|Delivered&q=&limit=50&offset=0 */
exports.listOrders = async (req, res) => {
  try {
    // kill caching completely
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    // ---- loud proof logs
    console.log('[listOrders] HIT', { url: req.originalUrl, query: req.query });
    const id = await req.db.request().query("SELECT DB_NAME() AS currentDb, @@SERVERNAME AS serverName");
    const { currentDb, serverName } = id.recordset[0];
    console.log('[listOrders] server/db:', serverName, currentDb);

    // ---- ZERO-FILTER, DIRECT SELECT from the DB we proved has rows
    const q = `
      SELECT TOP (50)
        o.OrderId,
        o.OrderNumber,
        o.CustomerName,
        o.CustomerEmail,
        COALESCE(NULLIF(o.FulFillmentStatus,''), o.Status) AS FulFillmentStatus,
        o.PlacedAt,
        o.TrackingNumber,
        o.Carrier,
        o.ShippedAt
      FROM [ShahuMumbai].[dbo].[Orders] AS o WITH (NOLOCK)
      ORDER BY o.PlacedAt DESC;
    `;
    console.log('[listOrders] running SQL:\n', q);

    const rs = await req.db.request().query(q);
    console.log('[listOrders] rowcount:', rs.recordset?.length ?? 0);

    const rows = rs.recordset || [];

    // map to UI shape (simple)
    const orders = rows.map((o) => ({
      id: o.OrderNumber,
      customer: o.CustomerName || o.CustomerEmail || 'Guest',
      status: (o.FulFillmentStatus || 'pending').replace(/^\w/, c => c.toUpperCase()),
      placed_at: o.PlacedAt,
      TrackingNumber: o.TrackingNumber || null,
      Carrier: o.Carrier || null,
      ShippedAt: o.ShippedAt || null,
    }));

    // include debug so we *know* this handler responded
    return res.status(200).json({
      orders,
      total: rows.length,
      debug: { serverName, currentDb, controller: __filename, rowcount: rows.length }
    });
  } catch (e) {
    console.error('orders.listOrders error:', e);
    return res.status(500).json({ error: 'internal_error', detail: e.message });
  }
};


/* PATCH /api/orders/:orderNumber/status */
exports.updateFulfillmentStatus = async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    let { fulfillment_status } = req.body || {};
    if (!orderNumber) return res.status(400).json({ error: 'missing_order_number' });
    if (!fulfillment_status) return res.status(400).json({ error: 'missing_status' });

    const normalized = String(fulfillment_status).toLowerCase();
    if (!['pending', 'shipped', 'delivered'].includes(normalized)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    let query = `
      UPDATE dbo.Orders
      SET FulFillmentStatus = @status,
          UpdatedAt = @updated_at
    `;
    const parameters = [
      { name: 'orderNumber', type: sql.NVarChar, value: orderNumber },
      { name: 'status', type: sql.NVarChar, value: normalized },
      { name: 'updated_at', type: sql.DateTime2, value: new Date() }
    ];

    if (normalized === 'shipped') {
      query += ', ShippedAt = ISNULL(ShippedAt, @shipped_at)';
      parameters.push({ name: 'shipped_at', type: sql.DateTime2, value: new Date() });
    }
    if (normalized === 'delivered') {
      query += ', DeliveredAt = ISNULL(DeliveredAt, @delivered_at)';
      parameters.push({ name: 'delivered_at', type: sql.DateTime2, value: new Date() });
    }

    query += `
      OUTPUT INSERTED.OrderNumber,
             INSERTED.FulFillmentStatus,
             INSERTED.ShippedAt,
             INSERTED.DeliveredAt,
             INSERTED.TrackingNumber,
             INSERTED.Carrier
      WHERE OrderNumber = @orderNumber
    `;

    const request = req.db.request();
    parameters.forEach(p => request.input(p.name, p.type, p.value));
    const result = await request.query(query);

    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json({ ok: true, order: result.recordset[0] });
  } catch (e) {
    console.error('orders.updateFulfillmentStatus error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* PUT /api/orders/:orderNumber/tracking */
exports.updateTracking = async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    const { trackingNumber, carrier } = req.body || {};

    if (!orderNumber) return res.status(400).json({ error: 'missing_order_number' });
    if (!trackingNumber || typeof trackingNumber !== 'string' || trackingNumber.trim().length === 0) {
      return res.status(400).json({ error: 'invalid_tracking_number' });
    }
    if (carrier && carrier.length > 50) {
      return res.status(400).json({ error: 'carrier_too_long' });
    }

    const request = req.db.request();
    request.input('orderNumber', sql.NVarChar, orderNumber);
    request.input('trackingNumber', sql.NVarChar(100), trackingNumber.trim());
    request.input('carrier', sql.NVarChar(50), carrier ? carrier.trim() : null);
    request.input('now', sql.DateTime2, new Date());

    const query = `
      DECLARE @UpdatedOrders TABLE (
        OrderId INT,
        OrderNumber NVARCHAR(100),
        TrackingNumber NVARCHAR(100),
        Carrier NVARCHAR(50),
        FulFillmentStatus NVARCHAR(50),
        ShippedAt DATETIME2,
        UpdatedAt DATETIME2,
        Email NVARCHAR(255)
      );

      UPDATE dbo.Orders
      SET 
          TrackingNumber    = @trackingNumber,
          Carrier           = @carrier,
          FulFillmentStatus = CASE WHEN FulFillmentStatus = 'delivered' THEN 'delivered' ELSE 'shipped' END,
          ShippedAt         = ISNULL(ShippedAt, @now),
          UpdatedAt         = @now
      OUTPUT 
          inserted.OrderId,
          inserted.OrderNumber,
          inserted.TrackingNumber,
          inserted.Carrier,
          inserted.FulFillmentStatus,
          inserted.ShippedAt,
          inserted.UpdatedAt,
          inserted.CustomerEmail AS Email
      INTO @UpdatedOrders
      WHERE OrderNumber = @orderNumber;

      SELECT * FROM @UpdatedOrders;
    `;

    const result = await request.query(query);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'order_not_found' });
    }

    const moduleResult = await req.db.request()
      .input('mailtype', sql.NVarChar, 'OrderTracking')
      .query('SELECT mailsubject, maildescription FROM module WHERE mailtype = @mailtype');

    const module = moduleResult.recordset[0];

    if (!module) {
      return res.status(400).json({ error: 'Order tracking email template not found' });
    }

    let mailContent = module.maildescription.replace(/#trackingId/g, trackingNumber);

    const plainTextContent = `
      Thank you for your purchase from Shahu Mumbai!
      Your Tracking Id: ${trackingNumber}
      Use this ID to track your order: https://shahumumbai.com/myorder
      Keep this token secure. Do not share it with anyone.
      Need help? Contact us at shahumumbai@gmail.com
      Shahu Mumbai — Mumbai, India
    `.trim();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: result.recordset[0].Email,
      subject: module.mailsubject,
      html: mailContent,
      text: plainTextContent,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true, order: result.recordset[0] });
  } catch (e) {
    console.error('orders.updateTracking error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};


/* GET /api/user/orders (Bearer) */
exports.getUserOrders = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId;
    let isGuest = true; 

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      isGuest = false;
    } else {
      userId = String(currentCartOwner(req));
    }

    let query;
    
    if (!isGuest) {
      query = `
        SELECT 
          o.OrderId, o.OrderNumber, o.CustomerName, o.CustomerEmail,
          o.FulFillmentStatus, o.PlacedAt, o.ShippedAt, o.DeliveredAt,
          o.SubTotal, o.ShippingTotal, o.TaxTotal, o.TrackingNumber, o.Carrier,
          o.Currency,
          u.UserId, u.FullName, u.Email,
          p.ProductId, p.Name, p.Price, pi.ImageUrl,
          oi.Qty, oi.UnitPrice
        FROM dbo.Orders o
        INNER JOIN dbo.Users u          ON o.UserId = CAST(u.UserId AS VARCHAR(50))
        LEFT  JOIN dbo.OrderItems oi    ON o.OrderId = oi.OrderId
        LEFT  JOIN dbo.Products p       ON oi.ProductId = p.ProductId
        LEFT  JOIN dbo.ProductImages pi ON p.ProductId = pi.ProductId AND pi.isHero = 'Y'
        WHERE u.UserId = @userId
        ORDER BY o.PlacedAt DESC;
      `;
    } else {
      query = `
        SELECT 
          o.OrderId, o.OrderNumber, o.CustomerName, o.CustomerEmail,
          o.FulFillmentStatus, o.PlacedAt, o.ShippedAt, o.DeliveredAt,
          o.SubTotal, o.ShippingTotal, o.TaxTotal, o.TrackingNumber, o.Carrier,
          o.Currency,
          p.ProductId, p.Name, p.Price, pi.ImageUrl,
          oi.Qty, oi.UnitPrice
        FROM dbo.Orders o
        LEFT  JOIN dbo.OrderItems oi    ON o.OrderId = oi.OrderId
        LEFT  JOIN dbo.Products p       ON oi.ProductId = p.ProductId
        LEFT  JOIN dbo.ProductImages pi ON p.ProductId = pi.ProductId AND pi.isHero = 'Y'
        WHERE o.UserId = @userId
        ORDER BY o.PlacedAt DESC;
      `;
    }

    const request = req.db.request();

    if (!isGuest) {
      request.input('userId', sql.Int, parseInt(userId, 10));
    } else {
      request.input('userId', sql.VarChar(100), userId);
    }

    const result = await request.query(query);

    const ordersMap = new Map();

    for (const row of result.recordset) {
      const key = row.OrderNumber;

      if (!ordersMap.has(key)) {
        ordersMap.set(key, {
          id: row.OrderNumber,
          customer: {
            name: row.CustomerName || (row.FullName || row.CustomerEmail) || 'Guest',
            email: row.Email || row.CustomerEmail || null
          },
          status: (row.FulFillmentStatus || 'pending')
            .replace(/^\w/, c => c.toUpperCase()),
          placed_at: row.PlacedAt,
          shipped_at: row.ShippedAt || null,
          delivered_at: row.DeliveredAt || null,
          subtotal: row.SubTotal || 0,
          shipping: row.ShippingTotal || 0,
          tax: row.TaxTotal || 0,
          tracking_number: row.TrackingNumber || null,
          carrier: row.Carrier || null,
          currency: row.Currency || 'USD',
          items: []
        });
      }

      if (row.ProductId) {
        ordersMap.get(key).items.push({
          product_id: row.ProductId,
          product_name: row.Name,
          quantity: row.Qty,
          image_url: row.ImageUrl || null,
          unit_price: row.UnitPrice,
          total_price: (row.Qty || 0) * (row.UnitPrice || 0)
        });
      }
    }

    const orders = Array.from(ordersMap.values());
    return res.json({ orders, total: orders.length });
  } catch (e) {
    console.error('orders.getUserOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

