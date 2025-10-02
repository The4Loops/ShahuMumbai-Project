const sql = require('mssql');

const toStart = (d) => (d ? `${d} 00:00:00.000` : null);
const toEnd   = (d) => (d ? `${d} 23:59:59.999` : null);
const dbReady = (req) => req.dbPool && req.dbPool.connected;
const devFakeAllowed = () => process.env.ALLOW_FAKE === '1';

/* 
   SUMMARY
   GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&top_limit=5
   Returns: { kpis, topProducts } */
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);
    const topLimit = Math.min(Number(req.query.top_limit || 5), 20);

    if (!dbReady(req) && devFakeAllowed()) {
      return res.json({
        kpis: {
          revenue_30d: 123456,
          orders_30d: 42,
          avg_order_value: 2939.43,
          refund_rate_pct: 2.38,
        },
        topProducts: [
          { product_title: 'Sample Lehenga', qty: 28, revenue: 56000, purchases: 15 },
          { product_title: 'Banarasi Saree', qty: 20, revenue: 40000, purchases: 12 },
        ].slice(0, topLimit),
      });
    }

    const clauses = [];
    const req1 = req.dbPool.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); req1.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   req1.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const ordersRes = await req1.query(`
      SELECT *
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt DESC
    `);

    const orders = ordersRes.recordset || [];
    const ordersCount = orders.length;

    let revenue = 0;
    let refundCount = 0;
    for (const o of orders) {
      revenue += Number(o.total || 0);
      if (String(o.status).toLowerCase() === 'refunded') refundCount += 1;
    }
    const kpis = {
      revenue_30d: revenue,
      orders_30d: ordersCount,
      avg_order_value: ordersCount ? revenue / ordersCount : 0,
      refund_rate_pct: ordersCount ? (refundCount / ordersCount) * 100 : 0,
    };

    let topProducts = [];
    if (orders.length) {
      const ids = orders.map(o => o.id);
      const inList = ids.map((_, i) => `@O${i}`).join(',');
      const itemsReq = req.dbPool.request();
      ids.forEach((id, i) => itemsReq.input(`O${i}`, sql.Int, id));

      const itemsRes = await itemsReq.query(`
        SELECT OrderId, ProductTitle, qty, LineTotal
        FROM dbo.OrderItems
        WHERE OrderId IN (${inList})
      `);

      const map = new Map(); 
      const purchasesByTitle = new Map(); 
      for (const it of (itemsRes.recordset || [])) {
        const t = it.product_title || 'Unknown';
        const cur = map.get(t) || { product_title: t, qty: 0, revenue: 0, purchases: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.line_total || 0);
        map.set(t, cur);

        if (!purchasesByTitle.has(t)) purchasesByTitle.set(t, new Set());
        purchasesByTitle.get(t).add(it.order_id);
      }
      for (const [t, set] of purchasesByTitle.entries()) {
        const cur = map.get(t);
        if (cur) cur.purchases = set.size;
      }
      topProducts = Array.from(map.values())
        .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
        .slice(0, topLimit);
    }

    return res.json({ kpis, topProducts });
  } catch (e) {
    console.error('dashboard.getSummary error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* 
   SALES (timeseries)
   GET /api/dashboard/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&metric=orders|revenue
   Returns: { data: [{ day, value }] } */
exports.getSales = async (req, res) => {
  try {
    const { from, to, metric = 'orders' } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    /* Dev fallback */
    if (!dbReady(req) && devFakeAllowed()) {
      return res.json({
        data: [
          { day: '2025-09-01', value: 5 },
          { day: '2025-09-02', value: 7 },
          { day: '2025-09-03', value: 3 },
        ],
      });
    }

    const clauses = [];
    const req1 = req.dbPool.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); req1.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   req1.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const rowsRes = await req1.query(`
      SELECT PlacedAt, total
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt ASC
      OFFSET 0 ROWS FETCH NEXT 5000 ROWS ONLY
    `);

    const rows = rowsRes.recordset || [];
    const byDay = new Map(); // YYYY-MM-DD -> value
    for (const r of rows) {
      const day = String(r.placed_at).slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, 0);
      if (metric === 'revenue') {
        byDay.set(day, byDay.get(day) + Number(r.total || 0));
      } else {
        byDay.set(day, byDay.get(day) + 1);
      }
    }
    const data = Array.from(byDay.entries())
      .map(([day, value]) => ({ day, value }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return res.json({ data });
  } catch (e) {
    console.error('dashboard.getSales error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/*   TOP PRODUCTS (standalone)
   GET /api/dashboard/top-products?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=5
   Returns: { items: [{ product_title, qty, revenue, purchases }] } */
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

    // limit to orders in window
    const clauses = [];
    const ordersReq = req.dbPool.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); ordersReq.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   ordersReq.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const oRes = await ordersReq.query(`
      SELECT *
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt DESC
    `);
    const orders = oRes.recordset || [];

    let itemsOut = [];
    if (orders.length) {
      const ids = orders.map(o => o.id);
      const inList = ids.map((_, i) => `@O${i}`).join(',');
      const itemsReq = req.dbPool.request();
      ids.forEach((id, i) => itemsReq.input(`O${i}`, sql.Int, id));

      const iRes = await itemsReq.query(`
        SELECT OrderId, ProductTitle, qty, LineTotal
        FROM dbo.OrderItems
        WHERE OrderId IN (${inList})
      `);

      const map = new Map();
      const purchasesByTitle = new Map();
      for (const it of (iRes.recordset || [])) {
        const t = it.product_title || 'Unknown';
        const cur = map.get(t) || { product_title: t, qty: 0, revenue: 0, purchases: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.line_total || 0);
        map.set(t, cur);

        if (!purchasesByTitle.has(t)) purchasesByTitle.set(t, new Set());
        purchasesByTitle.get(t).add(it.order_id);
      }
      for (const [t, set] of purchasesByTitle.entries()) {
        const cur = map.get(t); if (cur) cur.purchases = set.size;
      }
      itemsOut = Array.from(map.values())
        .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
        .slice(0, limit);
    }

    return res.json({ items: itemsOut });
  } catch (e) {
    console.error('dashboard.getTopProducts error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* RECENT ORDERS
   GET /api/dashboard/recent-orders?limit=5
   Returns: { orders: [{ order_id, occurred_at, customer, total, status }] }*/
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);

    /* Dev fallback */
    if (!dbReady(req) && devFakeAllowed()) {
      return res.json({
        orders: [
          {
            order_id: 'ORD-1001',
            occurred_at: new Date().toISOString(),
            customer: 'Guest',
            total: 1999,
            status: 'paid',
          },
        ],
      });
    }

    const ordersRes = await req.dbPool.request()
      .input('Limit', sql.Int, limit)
      .query(`
        SELECT TOP (@Limit)
          *
        FROM dbo.orders
        ORDER BY PlacedAt DESC
      `);

    const rows = ordersRes.recordset || [];

    // optional user enrichment
    const userIds = [...new Set(rows.map(r => r.user_id).filter(v => v !== null && v !== undefined))];
    let userMap = new Map();
    if (userIds.length) {
      const inList = userIds.map((_, i) => `@U${i}`).join(',');
      const uReq = req.dbPool.request();
      userIds.forEach((id, i) => uReq.input(`U${i}`, sql.Int, id));
      const uRes = await uReq.query(`
        SELECT UserId, FullName, Email
        FROM dbo.users
        WHERE id IN (${inList})
      `);
      userMap = new Map((uRes.recordset || []).map(u => [u.id, u]));
    }

    const out = rows.map(r => {
      const u = userMap.get(r.user_id);
      const customer = r.customer_name || u?.full_name || u?.email || r.customer_email || 'Guest';
      return {
        order_id: r.order_number || `ORD-${r.id}`,
        occurred_at: r.placed_at,
        total: Number(r.total || 0),
        status: r.status,
        customer,
      };
    });

    return res.json({ orders: out });
  } catch (e) {
    console.error('dashboard.getRecentOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};
