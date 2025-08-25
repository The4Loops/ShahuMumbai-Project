// controllers/dashboardController.js
const supabase = require("../config/supabaseClient");
const toStart = (d) => (d ? `${d} 00:00:00+00` : null);
const toEnd   = (d) => (d ? `${d} 23:59:59.999+00` : null);

// ---------- SUMMARY ----------
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);
    const topLimit = Math.min(Number(req.query.top_limit || 5), 20);

    // 1) Orders in window
    let oq = supabase
      .from('orders')
      .select('id,total,status,placed_at', { count: 'exact' })
      .order('placed_at', { ascending: false })
      .limit(5000);

    if (p_from) oq = oq.gte('placed_at', p_from);
    if (p_to)   oq = oq.lte('placed_at', p_to);

    const { data: orders, error: oErr, count } = await oq;
    if (oErr) throw new Error(`orders select failed: ${oErr.message}`);

    // KPIs
    let revenue = 0;
    let refundCount = 0;
    for (const o of orders) {
      revenue += Number(o.total || 0);
      if (o.status === 'refunded') refundCount += 1;
    }
    const ordersCount = count ?? orders.length;
    const kpis = {
      revenue_30d: revenue,
      orders_30d: ordersCount,
      avg_order_value: ordersCount ? revenue / ordersCount : 0,
      refund_rate_pct: ordersCount ? (refundCount / ordersCount) * 100 : 0,
    };

    // 2) Top products (aggregate in Node)
    const orderIds = orders.map(o => o.id);
    let topProducts = [];
    if (orderIds.length) {
      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('order_id, product_title, qty, line_total')
        .in('order_id', orderIds)
        .limit(10000); // safety cap
      if (iErr) throw new Error(`order_items select failed: ${iErr.message}`);

      const map = new Map(); // title -> { product_title, qty, revenue, purchases }
      const purchasesByTitle = new Map(); // title -> Set(order_id) to count purchases
      for (const it of items) {
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

// ---------- SALES ----------
exports.getSales = async (req, res) => {
  try {
    const { from, to, metric = 'orders' } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    // Fetch orders in window
    let q = supabase
      .from('orders')
      .select('placed_at, total')
      .order('placed_at', { ascending: true })
      .limit(5000);

    if (p_from) q = q.gte('placed_at', p_from);
    if (p_to)   q = q.lte('placed_at', p_to);

    const { data: rows, error } = await q;
    if (error) throw new Error(`orders select failed: ${error.message}`);

    const byDay = new Map(); // YYYY-MM-DD -> value
    for (const r of rows) {
      const day = String(r.placed_at).slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, 0);
      if (metric === 'revenue') {
        byDay.set(day, byDay.get(day) + Number(r.total || 0));
      } else {
        byDay.set(day, byDay.get(day) + 1); // orders count
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

// ---------- TOP PRODUCTS ----------
exports.getTopProducts = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 20);
    const p_from = toStart(req.query.from);
    const p_to   = toEnd(req.query.to);

    // limit to orders in window
    let oq = supabase.from('orders').select('id, placed_at').order('placed_at', { ascending: false }).limit(5000);
    if (p_from) oq = oq.gte('placed_at', p_from);
    if (p_to)   oq = oq.lte('placed_at', p_to);

    const { data: orders, error: oErr } = await oq;
    if (oErr) throw new Error(`orders select failed: ${oErr.message}`);

    let itemsOut = [];
    if (orders.length) {
      const orderIds = orders.map(o => o.id);
      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('order_id, product_title, qty, line_total')
        .in('order_id', orderIds)
        .limit(10000);
      if (iErr) throw new Error(`order_items select failed: ${iErr.message}`);

      const map = new Map();
      const purchasesByTitle = new Map();
      for (const it of items) {
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

// ---------- RECENT ORDERS ----------
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);

    const { data: rows, error } = await supabase
      .from('orders')
      .select('id, order_number, placed_at, status, total, user_id, customer_name, customer_email')
      .order('placed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`orders select failed: ${error.message}`);

    // optional user enrichment
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    let userMap = new Map();
    if (userIds.length) {
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);
      if (!uErr && Array.isArray(users)) {
        userMap = new Map(users.map(u => [u.id, u]));
      }
    }

    const out = rows.map(r => {
      const u = userMap.get(r.user_id);
      const customer = r.customer_name || u?.full_name || u?.email || r.customer_email || 'Guest';
      return {
        order_id: r.order_number || `ORD-${r.id}`,
        occurred_at: r.placed_at,
        customer,
        total: Number(r.total || 0),
        status: r.status
      };
    });

    return res.json({ orders: out });
  } catch (e) {
    console.error('dashboard.getRecentOrders error:', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};
