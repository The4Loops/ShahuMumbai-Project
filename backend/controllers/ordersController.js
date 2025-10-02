const sql = require('mssql');

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

    let query = `
      SELECT 
        OrderNumber,
        CustomerName,
        CustomerEmail,
        FulFillmentStatus,
        PlacedAt
      FROM orders
      ORDER BY PlacedAt DESC
    `;
    const parameters = [];

    if (status && status !== 'All') {
      const normalizedStatus = status.toLowerCase();
      if (!['pending', 'shipped', 'delivered'].includes(normalizedStatus)) {
        return res.status(400).json({ error: 'invalid_status' });
      }
      query += (q ? ' AND' : ' WHERE') + ' FulFillmentStatus = @status';
      parameters.push({ name: 'status', type: sql.NVarChar, value: normalizedStatus });
    }

    if (q) {
      query += (status && status !== 'All' ? ' AND' : ' WHERE') + ' (OrderNumber LIKE @q OR CustomerName LIKE @q)';
      parameters.push({ name: 'q', type: sql.NVarChar, value: `%${q}%` });
    }

    // Pagination
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);

    // Get total count
    let countQuery = 'SELECT COUNT(*) AS total FROM orders';
    if (status && status !== 'All') {
      countQuery += ' WHERE FulFillmentStatus = @status';
    }
    if (q && status && status !== 'All') {
      countQuery += ' AND (OrderNumber LIKE @q OR CustomerName LIKE @q)';
    } else if (q) {
      countQuery += ' WHERE (OrderNumber LIKE @q OR CustomerName LIKE @q)';
    }

    const countRequest = req.dbPool.request();
    parameters.forEach(param => countRequest.input(param.name, param.type, param.value));
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    // Map to minimal shape the UI expects
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