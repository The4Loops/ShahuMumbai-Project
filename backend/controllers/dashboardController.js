// dashboardController.js
const sql = require('mssql');

const toStart = d => (d ? `${d} 00:00:00.000` : null);
const toEnd   = d => (d ? `${d} 23:59:59.999` : null);

function dbReady(req) {
  return req.db && req.db.connected; // attached by DB middleware
}
const devFakeAllowed = () => process.env.ALLOW_FAKE === '1';

exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);
    const topLimit = Math.min(Number(req.query.top_limit || 5), 20);

    const clauses = [];
    const req1 = req.db.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); req1.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   req1.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    // ---- 1. Orders (revenue, count, refunds) ----
    const ordersRes = await req1.query(`
      SELECT OrderId, Total, Status
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt DESC
    `);
    const orders = ordersRes.recordset || [];

    let revenue = 0;
    let refundCount = 0;
    for (const o of orders) {
      revenue += Number(o.Total || 0);
      if (String(o.Status).toLowerCase() === 'refunded') refundCount += 1;
    }

    const kpis = {
      revenue_30d: parseFloat(revenue.toFixed(2)),
      orders_30d: orders.length,
      avg_order_value: orders.length ? parseFloat((revenue / orders.length).toFixed(2)) : 0,
      refund_rate_pct: orders.length ? parseFloat(((refundCount / orders.length) * 100).toFixed(2)) : 0,
    };

    // ---- 2. Top Products (by revenue) ----
    let topProducts = [];
    if (orders.length) {
      const ids = orders.map(o => o.OrderId);
      const inList = ids.map((_, i) => `@O${i}`).join(',');
      const itemsReq = req.db.request();
      ids.forEach((id, i) => itemsReq.input(`O${i}`, sql.Int, id));

      const itemsRes = await itemsReq.query(`
        SELECT oi.ProductTitle, oi.qty, oi.LineTotal
        FROM dbo.OrderItems oi
        WHERE oi.OrderId IN (${inList})
      `);

      const map = new Map();
      const purchasesByTitle = new Map();

      for (const it of (itemsRes.recordset || [])) {
        const t = it.ProductTitle || 'Unknown';
        const cur = map.get(t) || { ProductTitle: t, qty: 0, revenue: 0, purchases: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.LineTotal || 0);
        map.set(t, cur);

        if (!purchasesByTitle.has(t)) purchasesByTitle.set(t, new Set());
        purchasesByTitle.get(t).add(it.OrderId);
      }

      for (const [t, set] of purchasesByTitle.entries()) {
        const cur = map.get(t);
        if (cur) cur.purchases = set.size;
      }

      topProducts = Array.from(map.values())
        .map(p => ({
          ...p,
          revenue: parseFloat(p.revenue.toFixed(2)),
        }))
        .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
        .slice(0, topLimit);
    }

    return res.json({ kpis, topProducts });
  } catch (e) {
    console.error('dashboard.getSummary error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

exports.getSales = async (req, res) => {
  try {
    const { from, to, metric = 'orders' } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    const clauses = [];
    const req1 = req.db.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); req1.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   req1.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const rowsRes = await req1.query(`
      SELECT PlacedAt, Total
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt ASC
      OFFSET 0 ROWS FETCH NEXT 5000 ROWS ONLY
    `);

    const byDay = new Map(); // YYYY-MM-DD -> value
    for (const r of (rowsRes.recordset || [])) {
      const day = String(r.PlacedAt).slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, 0);
      if (metric === 'revenue') {
        byDay.set(day, byDay.get(day) + Number(r.Total || 0));
      } else {
        byDay.set(day, byDay.get(day) + 1);
      }
    }

    const data = Array.from(byDay.entries())
      .map(([day, value]) => ({
        day,
        value: metric === 'revenue' ? parseFloat(value.toFixed(2)) : value,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return res.json({ data });
  } catch (e) {
    console.error('dashboard.getSales error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 20);
    const p_from = toStart(req.query.from);
    const p_to   = toEnd(req.query.to);

    /* Dev fallback */
    if (!dbReady(req) && devFakeAllowed()) {
      return res.json({
        items: [
          { product_title: 'Sample Lehenga', qty: 28, revenue: 56000, purchases: 15 },
          { product_title: 'Banarasi Saree', qty: 20, revenue: 40000, purchases: 12 },
        ].slice(0, limit),
      });
    }

    const clauses = [];
    const ordersReq = req.db.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); ordersReq.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   ordersReq.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const oRes = await ordersReq.query(`
      SELECT OrderId
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt DESC
    `);
    const orders = oRes.recordset || [];

    let itemsOut = [];
    if (orders.length) {
      const ids = orders.map(o => o.OrderId);
      const inList = ids.map((_, i) => `@O${i}`).join(',');
      const itemsReq = req.db.request();
      ids.forEach((id, i) => itemsReq.input(`O${i}`, sql.Int, id));

      const iRes = await itemsReq.query(`
        SELECT oi.ProductTitle, oi.qty, oi.LineTotal
        FROM dbo.OrderItems oi
        WHERE oi.OrderId IN (${inList})
      `);

      const map = new Map();
      const purchasesByTitle = new Map();

      for (const it of (iRes.recordset || [])) {
        const t = it.ProductTitle || 'Unknown';
        const cur = map.get(t) || { ProductTitle: t, qty: 0, revenue: 0, purchases: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.LineTotal || 0);
        map.set(t, cur);

        if (!purchasesByTitle.has(t)) purchasesByTitle.set(t, new Set());
        purchasesByTitle.get(t).add(it.OrderId);
      }

      for (const [t, set] of purchasesByTitle.entries()) {
        const cur = map.get(t);
        if (cur) cur.purchases = set.size;
      }

      itemsOut = Array.from(map.values())
        .map(p => ({
          ...p,
          revenue: parseFloat(p.revenue.toFixed(2)),
        }))
        .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
        .slice(0, limit);
    }

    return res.json({ items: itemsOut });
  } catch (e) {
    console.error('dashboard.getTopProducts error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);

    const ordersRes = await req.db.request()
      .input('Limit', sql.Int, limit)
      .query(`
        SELECT TOP (@Limit)
          OrderId, OrderNumber, UserId, CustomerName, CustomerEmail, PlacedAt, Total, Status
        FROM dbo.orders
        ORDER BY PlacedAt DESC
      `);

    const rows = ordersRes.recordset || [];

    // ---- Enrich with user name/email if UserId exists ----
    const userIds = [...new Set(
      rows
        .map(r => r.UserId)
        .filter(id => id != null && typeof id === 'number' && !isNaN(id))
    )];

    let userMap = new Map();
    if (userIds.length > 0) {
      const inList = userIds.map((_, i) => `@U${i}`).join(',');
      const uReq = req.db.request();
      userIds.forEach((id, i) => uReq.input(`U${i}`, sql.Int, id));

      const uRes = await uReq.query(`
        SELECT UserId, FullName, Email
        FROM dbo.users
        WHERE UserId IN (${inList})
      `);
      userMap = new Map((uRes.recordset || []).map(u => [u.UserId, u]));
    }

    const out = rows.map(r => {
      const u = userMap.get(r.UserId);
      const customer = r.CustomerName || u?.FullName || u?.Email || r.CustomerEmail || 'Guest';
      return {
        order_id: r.OrderNumber || `ORD-${r.OrderId}`,
        occurred_at: r.PlacedAt,
        total: parseFloat((Number(r.Total || 0)).toFixed(2)),
        status: r.Status,
        customer,
      };
    });

    return res.json({ orders: out });
  } catch (e) {
    console.error('dashboard.getRecentOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};