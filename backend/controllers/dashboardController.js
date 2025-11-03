const sql = require('mssql');

// Helper to get exchange rate from DB
const getExchangeRate = async (dbPool, currency = 'USD') => {
  try {
    const result = await dbPool.request()
      .input('CurrencyCode', sql.VarChar(3), currency.toUpperCase())
      .query('SELECT ExchangeRate FROM Currencies WHERE CurrencyCode = @CurrencyCode');
    
    return result.recordset[0]?.ExchangeRate || 1.0; // Fallback to USD
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 1.0; // Fallback on error
  }
};

const toStart = (d) => (d ? `${d} 00:00:00.000` : null);
const toEnd   = (d) => (d ? `${d} 23:59:59.999` : null);
function dbReady(req) {
  return req.db && req.db.connected;  // ← FIXED
}
const devFakeAllowed = () => process.env.ALLOW_FAKE === '1';

/* 
   SUMMARY
   GET /api/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&top_limit=5&currency=USD
   Returns: { kpis, topProducts, currency }
*/
exports.getSummary = async (req, res) => {
  try {
    const { from, to, currency = 'USD' } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);
    const topLimit = Math.min(Number(req.query.top_limit || 5), 20);
    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    const clauses = [];
    const req1 = req.db.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); req1.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   req1.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    // Fetch orders with Currency column
    const ordersRes = await req1.query(`
      SELECT OrderId, Total, Status, Currency
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt DESC
    `);

    const orders = ordersRes.recordset || [];
    const ordersCount = orders.length;

    let revenue = 0;
    let refundCount = 0;
    const orderCurrencies = [...new Set(orders.map(o => o.Currency || 'USD'))];
    const exchangeRates = new Map();
    exchangeRates.set(currency, 1.0); // Target currency

    // Fetch exchange rates for all currencies used in orders
    for (const curr of orderCurrencies) {
      if (curr !== currency) {
        exchangeRates.set(curr, await getExchangeRate(req.dbPool, curr));
      }
    }

    for (const o of orders) {
      const orderCurrency = o.Currency || 'USD';
      const rate = exchangeRates.get(orderCurrency) / exchangeRate; // Convert to target currency
      revenue += Number(o.Total || 0) * rate;
      if (String(o.Status).toLowerCase() === 'refunded') refundCount += 1;
    }

    const kpis = {
      revenue_30d: parseFloat(revenue.toFixed(2)),
      orders_30d: ordersCount,
      avg_order_value: ordersCount ? parseFloat((revenue / ordersCount).toFixed(2)) : 0,
      refund_rate_pct: ordersCount ? parseFloat(((refundCount / ordersCount) * 100).toFixed(2)) : 0,
      currency,
    };

    let topProducts = [];
    if (orders.length) {
      const ids = orders.map(o => o.OrderId);
      const inList = ids.map((_, i) => `@O${i}`).join(',');
      const itemsReq = req.db.request();
      ids.forEach((id, i) => itemsReq.input(`O${i}`, sql.Int, id));

      // Fetch order items with order's currency
      const itemsRes = await itemsReq.query(`
        SELECT oi.OrderId, oi.ProductTitle, oi.qty, oi.LineTotal, o.Currency
        FROM dbo.OrderItems oi
        INNER JOIN dbo.orders o ON oi.OrderId = o.OrderId
        WHERE oi.OrderId IN (${inList})
      `);

      const map = new Map(); 
      const purchasesByTitle = new Map(); 
      for (const it of (itemsRes.recordset || [])) {
        const t = it.ProductTitle || 'Unknown';
        const orderCurrency = it.Currency || 'USD';
        const rate = exchangeRates.get(orderCurrency) / exchangeRate; // Convert to target currency
        const cur = map.get(t) || { ProductTitle: t, qty: 0, revenue: 0, purchases: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.LineTotal || 0) * rate;
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
          currency,
        }))
        .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
        .slice(0, topLimit);
    }

    return res.json({ kpis, topProducts, currency });
  } catch (e) {
    console.error('dashboard.getSummary error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* 
   SALES (timeseries)
   GET /api/dashboard/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&metric=orders|revenue&currency=USD
   Returns: { data: [{ day, value, currency }], currency }
*/
exports.getSales = async (req, res) => {
  try {
    const { from, to, metric = 'orders', currency = 'USD' } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);
    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    const clauses = [];
    const req1 = req.db.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); req1.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   req1.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const rowsRes = await req1.query(`
      SELECT PlacedAt, total, Currency
      FROM dbo.orders
      ${where}
      ORDER BY PlacedAt ASC
      OFFSET 0 ROWS FETCH NEXT 5000 ROWS ONLY
    `);

    const rows = rowsRes.recordset || [];
    const orderCurrencies = [...new Set(rows.map(r => r.Currency || 'USD'))];
    const exchangeRates = new Map();
    exchangeRates.set(currency, 1.0);

    // Fetch exchange rates for all currencies used in orders
    for (const curr of orderCurrencies) {
      if (curr !== currency) {
        exchangeRates.set(curr, await getExchangeRate(req.dbPool, curr));
      }
    }

    const byDay = new Map(); // YYYY-MM-DD -> value
    for (const r of rows) {
      const day = String(r.PlacedAt).slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, 0);
      const orderCurrency = r.Currency || 'USD';
      const rate = exchangeRates.get(orderCurrency) / exchangeRate;
      if (metric === 'revenue') {
        byDay.set(day, byDay.get(day) + Number(r.total || 0) * rate);
      } else {
        byDay.set(day, byDay.get(day) + 1);
      }
    }
    const data = Array.from(byDay.entries())
      .map(([day, value]) => ({
        day,
        value: metric === 'revenue' ? parseFloat(value.toFixed(2)) : value,
        currency: metric === 'revenue' ? currency : undefined,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return res.json({ data, currency });
  } catch (e) {
    console.error('dashboard.getSales error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* 
   TOP PRODUCTS (standalone)
   GET /api/dashboard/top-products?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=5&currency=USD
   Returns: { items: [{ product_title, qty, revenue, purchases, currency }], currency }
*/
exports.getTopProducts = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 20);
    const p_from = toStart(req.query.from);
    const p_to   = toEnd(req.query.to);
    const { currency = 'USD' } = req.query;
    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    /* Dev fallback */
    if (!dbReady(req) && devFakeAllowed()) {
      return res.json({
        items: [
          { product_title: 'Sample Lehenga', qty: 28, revenue: 56000, purchases: 15, currency },
          { product_title: 'Banarasi Saree', qty: 20, revenue: 40000, purchases: 12, currency },
        ].slice(0, limit),
        currency,
      });
    }

    // limit to orders in window
    const clauses = [];
    const ordersReq = req.db.request();
    if (p_from) { clauses.push('PlacedAt >= @From'); ordersReq.input('From', sql.DateTime2, new Date(p_from)); }
    if (p_to)   { clauses.push('PlacedAt <= @To');   ordersReq.input('To',   sql.DateTime2, new Date(p_to)); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const oRes = await ordersReq.query(`
      SELECT OrderId, Currency
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
        SELECT oi.OrderId, oi.ProductTitle, oi.qty, oi.LineTotal, o.Currency
        FROM dbo.OrderItems oi
        INNER JOIN dbo.orders o ON oi.OrderId = o.OrderId
        WHERE oi.OrderId IN (${inList})
      `);

      const orderCurrencies = [...new Set(orders.map(o => o.Currency || 'USD'))];
      const exchangeRates = new Map();
      exchangeRates.set(currency, 1.0);
      for (const curr of orderCurrencies) {
        if (curr !== currency) {
          exchangeRates.set(curr, await getExchangeRate(req.dbPool, curr));
        }
      }

      const map = new Map();
      const purchasesByTitle = new Map();
      for (const it of (iRes.recordset || [])) {
        const t = it.ProductTitle || 'Unknown';
        const orderCurrency = it.Currency || 'USD';
        const rate = exchangeRates.get(orderCurrency) / exchangeRate;
        const cur = map.get(t) || { ProductTitle: t, qty: 0, revenue: 0, purchases: 0 };
        cur.qty += Number(it.qty || 0);
        cur.revenue += Number(it.LineTotal || 0) * rate;
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
          currency,
        }))
        .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
        .slice(0, limit);
    }

    return res.json({ items: itemsOut, currency });
  } catch (e) {
    console.error('dashboard.getTopProducts error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

/* 
   RECENT ORDERS
   GET /api/dashboard/recent-orders?limit=5&currency=USD
   Returns: { orders: [{ order_id, occurred_at, customer, total, status, currency }], currency }
*/
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);
    const { currency = 'USD' } = req.query;
    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    const ordersRes = await req.db.request()
      .input('Limit', sql.Int, limit)
      .query(`
        SELECT TOP (@Limit)
          OrderId, OrderNumber, UserId, CustomerName, CustomerEmail, PlacedAt, Total, Status, Currency
        FROM dbo.orders
        ORDER BY PlacedAt DESC
      `);

    const rows = ordersRes.recordset || [];
    // Fetch exchange rates for all currencies in orders
    const orderCurrencies = [...new Set(rows.map(r => r.Currency || 'USD'))];
    const exchangeRates = new Map();
    exchangeRates.set(currency, 1.0);
    for (const curr of orderCurrencies) {
      if (curr !== currency) {
        exchangeRates.set(curr, await getExchangeRate(req.dbPool, curr));
      }
    }

    // Optional user enrichment
    const userIds = [...new Set(rows.map(r => r.UserId).filter(v => v !== null && v !== undefined))];
    let userMap = new Map();
    if (userIds.length) {
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
      const orderCurrency = r.Currency || 'USD';
      const rate = exchangeRates.get(orderCurrency) / exchangeRate;
      return {
        order_id: r.OrderNumber || `ORD-${r.OrderId}`,
        occurred_at: r.PlacedAt,
        total: parseFloat((Number(r.Total || 0) * rate).toFixed(2)),
        status: r.Status,
        customer,
        currency,
      };
    });

    return res.json({ orders: out, currency });
  } catch (e) {
    console.error('dashboard.getRecentOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};