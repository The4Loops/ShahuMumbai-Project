// controllers/analytics.controller.js
const sql = require('mssql');

// Helpers: YYYY-MM-DD → UTC day bounds (store/report in UTC)
const toStart = (d) => (d ? `${d}T00:00:00.000Z` : null);
const toEnd   = (d) => (d ? `${d}T23:59:59.999Z` : null);

// Safely stringify JSON for MSSQL NVARCHAR(MAX)
const jsonOrNull = (v) => (v == null ? null : JSON.stringify(v));

// POST /api/track
exports.trackEvent = async (req, res) => {
  try {
    const {
      name,
      anon_id,
      user_id,
      url,
      referrer,
      utm = {},
      properties = {},
    } = req.body || {};

    if (!name || !anon_id) {
      return res.status(400).json({ error: 'name and anon_id are required' });
    }

    const user_agent = req.headers['user-agent'] || null;
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
      req.ip ||
      null;

    const r = await req.db.request()
      .input('name', sql.NVarChar(100), String(name))
      .input('anon_id', sql.NVarChar(64), String(anon_id))
      .input('user_id', user_id == null ? sql.Int : sql.Int, user_id ?? null)
      .input('url', sql.NVarChar(sql.MAX), url || null)
      .input('referrer', sql.NVarChar(sql.MAX), referrer || null)
      .input('utm', sql.NVarChar(sql.MAX), jsonOrNull(utm))
      .input('props', sql.NVarChar(sql.MAX), jsonOrNull(properties))
      .input('user_agent', sql.NVarChar(512), user_agent)
      .input('ip', sql.NVarChar(64), ip)
      .query(`
        INSERT INTO analytics_events
          (name, AnonId, UserId, url, referrer, utm, props, UserAgent, ip, OccurredAt)
        VALUES
          (@name, @anon_id, @user_id, @url, @referrer, @utm, @props, @user_agent, @ip, SYSUTCDATETIME());
      `);

    return res.json({ ok: true });
  } catch (e) {
    console.error('trackEvent error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    // If you’ve created a proc similar to supabase.rpc('analytics_kpis')
    // EXEC analytics_kpis @p_from, @p_to
    // Fallback: compute KPIs in SQL inline to avoid fetching 5000 rows

    const kpiReq = req.db.request();
    if (p_from) kpiReq.input('from', sql.DateTime2, new Date(p_from));
    if (p_to)   kpiReq.input('to', sql.DateTime2, new Date(p_to));

    const where = [];
    if (p_from) where.push('OccurredAt >= @from');
    if (p_to)   where.push('OccurredAt <= @to');
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const kpiSql = `
      ;WITH base AS (
        SELECT name, AnonId, UserId
        FROM AnalyticsEvent
        ${whereSql}
      )
      SELECT
        (SELECT COUNT(*) FROM base) AS total_events,
        (SELECT COUNT(DISTINCT AnonId) FROM base WHERE AnonId IS NOT NULL) AS unique_sessions,
        (SELECT COUNT(DISTINCT UserId) FROM base WHERE UserId IS NOT NULL)  AS unique_users,
        (SELECT COUNT(*) FROM base WHERE name = 'view_item')       AS view_item,
        (SELECT COUNT(*) FROM base WHERE name = 'add_to_cart')     AS add_to_cart,
        (SELECT COUNT(*) FROM base WHERE name = 'begin_checkout')  AS begin_checkout,
        (SELECT COUNT(*) FROM base WHERE name = 'purchase')        AS purchase;
    `;

    const kpiRes = await kpiReq.query(kpiSql);
    const kpis = kpiRes.recordset?.[0] || {
      total_events: 0, unique_sessions: 0, unique_users: 0,
      view_item: 0, add_to_cart: 0, begin_checkout: 0, purchase: 0
    };

    // Top products: try proc equivalent to analytics_top_products; else do quick tally from add_to_cart
    const tpReq = req.db.request();
    if (p_from) tpReq.input('from', sql.DateTime2, new Date(p_from));
    if (p_to)   tpReq.input('to', sql.DateTime2, new Date(p_to));

    const topProductsSql = `
      ;WITH addc AS (
        SELECT
          CASE
            WHEN JSON_VALUE(props, '$.title') IS NOT NULL THEN JSON_VALUE(props, '$.title')
            WHEN JSON_VALUE(props, '$.item_name') IS NOT NULL THEN JSON_VALUE(props, '$.item_name')
            ELSE 'Unknown'
          END AS product_title
        FROM AnalyticsEvent
        WHERE name = 'add_to_cart'
          ${p_from ? 'AND OccurredAt >= @from' : ''}
          ${p_to   ? 'AND OccurredAt <= @to'   : ''}
      )
      SELECT TOP 10 product_title, COUNT(*) AS add_to_cart_count
      FROM addc
      GROUP BY product_title
      ORDER BY add_to_cart_count DESC;
    `;
    const tpRes = await tpReq.query(topProductsSql);
    const topProducts = tpRes.recordset || [];

    return res.json({ kpis, topProducts });
  } catch (e) {
    console.error('getSummary error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// GET /api/analytics/daily?from=YYYY-MM-DD&to=YYYY-MM-DD&name=add_to_cart
exports.getDailyCounts = async (req, res) => {
  try {
    const { from, to, name } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    const r = req.db.request();
    if (name)   r.input('name', sql.NVarChar(100), name);
    if (p_from) r.input('from', sql.DateTime2, new Date(p_from));
    if (p_to)   r.input('to', sql.DateTime2, new Date(p_to));

    const where = [];
    if (name)   where.push('name = @name');
    if (p_from) where.push('OccurredAt >= @from');
    if (p_to)   where.push('OccurredAt <= @to');
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const q = await r.query(`
      SELECT
        CAST(OccurredAt AS date) AS day,
        name,
        COUNT(*) AS count
      FROM AnalyticsEvent
      ${whereSql}
      GROUP BY CAST(OccurredAt AS date), name
      ORDER BY day ASC;
    `);

    return res.json({ data: q.recordset || [] });
  } catch (e) {
    console.error('getDailyCounts error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// GET /api/analytics/events?limit=100&offset=0&name=add_to_cart
exports.getEvents = async (req, res) => {
  try {
    const limit  = Math.min(Number(req.query.limit || 100), 500);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const name   = req.query.name || null;

    const r = req.db.request()
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);

    if (name) r.input('name', sql.NVarChar(100), name);

    const q = await r.query(`
      SELECT
        AnalyticsEventId,
        OccurredAt,
        name,
        AnonId,
        UserId,
        url,
        referrer,
        utm,
        props
      FROM AnalyticsEvent
      ${name ? 'WHERE name = @name' : ''}
      ORDER BY OccurredAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `);

    return res.json({ events: q.recordset || [] });
  } catch (e) {
    console.error('getEvents error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// GET /api/analytics/sales-report
exports.getSalesReport = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // If your schema matches Supabase tables:
    // orders(id, placed_at, payment_status, status), order_items(order_id, product_id, product_title, qty)
    const paidPaymentStatuses = ['PAID', 'SUCCESS', 'CAPTURED'];
    const paidOrderStatuses   = ['PAID', 'COMPLETED', 'SUCCESS', 'FULFILLED'];

    const reqBase = req.db.request()
      .input('d24', sql.DateTime2, last24h)
      .input('d30', sql.DateTime2, last30d);

    // Count paid orders (payment_status) with fallback to status, across three windows
    const salesSql = `
      ;WITH paid AS (
        SELECT OrderId, PlacedAt
        FROM orders
        WHERE PaymentStatus IN (${paidPaymentStatuses.map((_, i) => `'${paidPaymentStatuses[i]}'`).join(', ')})
        UNION
        SELECT OrderId, PlacedAt
        FROM orders
        WHERE PaymentStatus IS NULL
          AND status IN (${paidOrderStatuses.map((_, i) => `'${paidOrderStatuses[i]}'`).join(', ')})
      )
      SELECT
        (SELECT COUNT(*) FROM paid WHERE PlacedAt >= @d24) AS c24,
        (SELECT COUNT(*) FROM paid WHERE PlacedAt >= @d30) AS c30,
        (SELECT COUNT(*) FROM paid)                        AS call;
    `;
    const sRes = await reqBase.query(salesSql);
    const sRow = sRes.recordset?.[0] || { c24: 0, c30: 0, call: 0 };

    // Top products from ALL paid orders
    const paidIdsRes = await req.db.request().query(`
      ;WITH paid AS (
        SELECT OrderId
        FROM orders
        WHERE PaymentStatus IN (${paidPaymentStatuses.map(s => `'${s}'`).join(', ')})
        UNION
        SELECT OrderId
        FROM orders
        WHERE PaymentStatus IS NULL
          AND status IN (${paidOrderStatuses.map(s => `'${s}'`).join(', ')})
      )
      SELECT OrderId AS id FROM paid;
    `);
    const paidIds = paidIdsRes.recordset?.map(r => r.id) || [];

    let topProducts = [];
    if (paidIds.length) {
      // chunk IN() to avoid parameter limits if needed; assuming small here
      const r = await req.db.request().query(`
        SELECT
          MAX(Products.ProductId) AS id,
          MAX(OrderItems.ProductTitle) AS name,
          ProductImages.ImageUrl AS image,
          SUM(TRY_CONVERT(int, OrderItems.qty)) AS sales
        FROM OrderItems
        Inner Join Products ON OrderItems.ProductId = Products.ProductId
        Inner Join ProductImages ON Products.ProductId = ProductImages.ProductId
        WHERE ProductImages.IsHero='Y' and OrderId IN (${paidIds.map(id => `'${id}'`).join(',')})
        GROUP BY COALESCE(CAST(Products.ProductId AS NVARCHAR(64)), CONCAT('title:', COALESCE(OrderItems.ProductTitle, 'Untitled'))),ProductImages.ImageUrl
        ORDER BY sales DESC
        OFFSET 0 ROWS FETCH NEXT 6 ROWS ONLY;
      `);
      topProducts = (r.recordset || []).map(x => ({
        id: x.id,
        name: x.name || 'Untitled',
        image: x.image,
        sales: Number(x.sales || 0),
      }));
    }

    return res.json({
      summary: [
        { name: 'Last 24h', sales: sRow.c24 || 0 },
        { name: '30 Days',  sales: sRow.c30 || 0 },
        { name: 'All Time', sales: sRow.call || 0 },
      ],
      topProducts,
    });
  } catch (e) {
    console.error('getSalesReport error', e);
    return res.status(500).json({ error: 'internal_error', details: e.message });
  }
};