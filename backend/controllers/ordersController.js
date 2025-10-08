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
      const normalizedStatus = status.toLowerCase();
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
        OrderNumber,
        CustomerName,
        CustomerEmail,
        FulFillmentStatus,
        PlacedAt
      FROM orders
      ${whereClause}
      ORDER BY PlacedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    const countQuery = `SELECT COUNT(*) AS total FROM orders${whereClause}`;

    const countRequest = req.dbPool.request();
    parameters.forEach(param => countRequest.input(param.name, param.type, param.value));
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    const orders = result.recordset.map(o => ({
      id: o.OrderNumber,
      customer: o.CustomerName || o.CustomerEmail || 'Guest',
      status: (o.FulFillmentStatus || 'pending').replace(/^\w/, c => c.toUpperCase()),
      placed_at: o.PlacedAt,
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

    let query = `
      UPDATE orders
      SET FulFillmentStatus = @status, UpdatedAt = @updated_at
    `;
    const parameters = [
      { name: 'orderNumber', type: sql.NVarChar, value: orderNumber },
      { name: 'status', type: sql.NVarChar, value: normalized },
      { name: 'updated_at', type: sql.DateTime, value: new Date().toISOString() }
    ];

    if (normalized === 'shipped') {
      query += ', ShippedAt = @shipped_at';
      parameters.push({ name: 'shipped_at', type: sql.DateTime, value: new Date().toISOString() });
    }
    if (normalized === 'delivered') {
      query += ', DeliveredAt = @delivered_at';
      parameters.push({ name: 'delivered_at', type: sql.DateTime, value: new Date().toISOString() });
    }

    query += ' OUTPUT INSERTED.OrderNumber, INSERTED.FulFillmentStatus, INSERTED.ShippedAt, INSERTED.DeliveredAt WHERE OrderNumber = @orderNumber';

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const data = result.recordset[0];
    return res.json({ ok: true, order: data });
  } catch (e) {
    console.error('orders.updateFulfillmentStatus error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assumes JWT_SECRET is set in environment
      userId = decoded.id; // Assumes userId is stored in the JWT payload
    } catch (e) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'missing_user_id' });
    }
  
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
        u.UserId,
        u.FullName,
        u.Email,
        p.ProductId,
        p.Name,
        p.Price,  
        oi.Qty,
        oi.UnitPrice
      FROM orders o
      INNER JOIN users u ON o.UserId = u.UserId
      LEFT JOIN orderitems oi ON o.OrderId = oi.OrderId
      LEFT JOIN products p ON oi.ProductId = p.ProductId
      WHERE o.UserId = @userId
      ORDER BY o.PlacedAt DESC
    `;

    const request = req.dbPool.request();
    request.input('userId', sql.Int, userId);

    const result = await request.query(query);

    // Group results by order to handle multiple order items
    const ordersMap = new Map();
    result.recordset.forEach(row => {
      const orderId = row.OrderNumber;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          customer: {
            name: row.CustomerName || row.CustomerEmail || 'Guest',
            email: row.UserEmail,
            address: row.CustomerAddress || 'N/A',
            payment: row.PaymentMethod || 'N/A'
          },
          status: (row.FulFillmentStatus || 'pending').replace(/^\w/, c => c.toUpperCase()),
          placed_at: row.PlacedAt,
          shipped_at: row.ShippedAt || null,
          delivered_at: row.DeliveredAt || null,
          subtotal: row.SubTotal || 0,
          shipping: row.ShippingTotal || 0,
          tax: row.TaxTotal || 0,
          user: {
            id: row.UserId,
            username: row.FullName,
            email: row.Email
          },
          items: []
        });
      }
      if (row.ProductId) {
        ordersMap.get(orderId).items.push({
          product_id: row.ProductId,
          product_name: row.Name,
          quantity: row.Qty,
          unit_price: row.UnitPrice,
          total_price: row.Qty * row.UnitPrice
        });
      }
    });

    const orders = Array.from(ordersMap.values());

    return res.json({ orders, total: orders.length });
  } catch (e) {
    console.error('orders.getUserOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};