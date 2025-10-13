const sql = require('mssql');
const jwt = require('jsonwebtoken');

/* GET /api/orders?status=All|Pending|Shipped|Delivered&q=&limit=50&offset=0 */
exports.listOrders = async (req, res) => {
  try {
    const {
      status = 'All',
      q = '',
      limit: limitStr = '50',
      offset: offsetStr = '0',
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    const parameters = [];
    const whereConditions = [];

    if (status && status !== 'All') {
      const normalizedStatus = String(status).toLowerCase();
      if (!['pending', 'shipped', 'delivered'].includes(normalizedStatus)) {
        return res.status(400).json({ error: 'invalid_status' });
      }
      whereConditions.push('FulFillmentStatus = @status');
      parameters.push({ name: 'status', type: sql.NVarChar, value: normalizedStatus });
    }

    if (q) {
      whereConditions.push('(OrderNumber LIKE @q OR CustomerName LIKE @q)');
      parameters.push({ name: 'q', type: sql.NVarChar, value: `%${q}%` });
    }

    const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

    const query = `
      SELECT 
        OrderId,
        OrderNumber,
        CustomerName,
        CustomerEmail,
        FulFillmentStatus,
        PlacedAt,
        TrackingNumber,
        Carrier,
        ShippedAt
      FROM dbo.Orders
      ${whereClause}
      ORDER BY PlacedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const request = req.dbPool.request();
    parameters.forEach(p => request.input(p.name, p.type, p.value));
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const countQuery = `SELECT COUNT(*) AS total FROM dbo.Orders${whereClause}`;
    const countRequest = req.dbPool.request();
    parameters.forEach(p => countRequest.input(p.name, p.type, p.value));
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    const orders = result.recordset.map(o => ({
      // front-end expects id = OrderNumber
      id: o.OrderNumber,
      customer: o.CustomerName || o.CustomerEmail || 'Guest',
      status: (o.FulFillmentStatus || 'pending').replace(/^\w/, c => c.toUpperCase()), // Pending|Shipped|Delivered
      placed_at: o.PlacedAt,
      TrackingNumber: o.TrackingNumber || null,
      Carrier: o.Carrier || null,
      ShippedAt: o.ShippedAt || null,
    }));

    return res.json({ orders, total });
  } catch (e) {
    console.error('orders.listOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* PATCH /api/orders/:orderNumber/status { fulfillment_status: "Pending|Shipped|Delivered" } */
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

    // Build dynamic update for timestamps
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

    const request = req.dbPool.request();
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

/* PUT /api/orders/:orderNumber/tracking  { trackingNumber: string, carrier?: string } */
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

    const request = req.dbPool.request();
    request.input('orderNumber', sql.NVarChar, orderNumber);
    request.input('trackingNumber', sql.NVarChar(100), trackingNumber.trim());
    request.input('carrier', sql.NVarChar(50), carrier ? carrier.trim() : null);
    request.input('now', sql.DateTime2, new Date());

    // Set tracking + auto flip to 'shipped' if not delivered yet
    const query = `
      UPDATE dbo.Orders
      SET TrackingNumber   = @trackingNumber,
          Carrier          = @carrier,
          FulFillmentStatus= CASE WHEN FulFillmentStatus = 'delivered' THEN 'delivered' ELSE 'shipped' END,
          ShippedAt        = ISNULL(ShippedAt, @now),
          UpdatedAt        = @now
      OUTPUT INSERTED.OrderId,
             INSERTED.OrderNumber,
             INSERTED.CustomerName,
             INSERTED.FulFillmentStatus,
             INSERTED.TrackingNumber,
             INSERTED.Carrier,
             INSERTED.ShippedAt
      WHERE OrderNumber = @orderNumber
    `;

    const result = await request.query(query);
    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ ok: true, order: result.recordset[0] });
  } catch (e) {
    console.error('orders.updateTracking error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* GET /api/user/orders  (requires Bearer JWT) */
exports.getUserOrders = async (req, res) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'missing_or_invalid_token' });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
    if (!userId) return res.status(400).json({ error: 'missing_user_id' });

    const query = `
      SELECT 
        o.OrderId,
        o.OrderNumber,
        o.CustomerName,
        o.CustomerEmail,
        o.FulFillmentStatus,
        o.PlacedAt,
        o.ShippedAt,
        o.DeliveredAt,
        o.SubTotal,
        o.ShippingTotal,
        o.TaxTotal,
        o.TrackingNumber,
        o.Carrier,
        u.UserId,
        u.FullName,
        u.Email,
        p.ProductId,
        p.Name,
        p.Price,  
        oi.Qty,
        oi.UnitPrice
      FROM dbo.Orders o
      INNER JOIN dbo.Users u      ON o.UserId = u.UserId
      LEFT  JOIN dbo.OrderItems oi ON o.OrderId = oi.OrderId
      LEFT  JOIN dbo.Products p     ON oi.ProductId = p.ProductId
      WHERE o.UserId = @userId
      ORDER BY o.PlacedAt DESC
    `;

    const request = req.dbPool.request();
    request.input('userId', sql.Int, userId);
    const result = await request.query(query);

    const ordersMap = new Map();
    for (const row of result.recordset) {
      const key = row.OrderNumber;
      if (!ordersMap.has(key)) {
        ordersMap.set(key, {
          id: row.OrderNumber,
          customer: {
            name: row.CustomerName || row.CustomerEmail || 'Guest',
            email: row.Email || row.CustomerEmail || null,
          },
          status: (row.FulFillmentStatus || 'pending').replace(/^\w/, c => c.toUpperCase()),
          placed_at: row.PlacedAt,
          shipped_at: row.ShippedAt || null,
          delivered_at: row.DeliveredAt || null,
          subtotal: row.SubTotal || 0,
          shipping: row.ShippingTotal || 0,
          tax: row.TaxTotal || 0,
          tracking_number: row.TrackingNumber || null,
          carrier: row.Carrier || null,
          items: []
        });
      }
      if (row.ProductId) {
        ordersMap.get(key).items.push({
          product_id: row.ProductId,
          product_name: row.Name,
          quantity: row.Qty,
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
