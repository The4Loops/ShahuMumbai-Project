const supabase = require("../config/supabaseClient");

// Helpers for date parsing (YYYY-MM-DD from query)
const toStart = (d) => (d ? `${d} 00:00:00+00` : null);
const toEnd   = (d) => (d ? `${d} 23:59:59.999+00` : null);

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
      return res.status(400).json({ error: "name and anon_id are required" });
    }

    const user_agent = req.headers["user-agent"] || null;
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || req.ip || null;

    const { error } = await supabase.from("analytics_events").insert([{
      name: String(name),
      anon_id: String(anon_id),
      user_id: user_id ?? null,
      url: url || null,
      referrer: referrer || null,
      utm,
      props: properties,
      user_agent,
      ip
    }]);

    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    console.error("trackEvent error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

// GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    let kpis = null;
    try {
      const k = await supabase.rpc("analytics_kpis", { p_from, p_to });
      if (!k.error && Array.isArray(k.data) && k.data.length) {
        kpis = k.data[0];
      }
    } catch (_) {}

    // ---- Fallback: compute KPIs in Node by fetching a reasonable window
    if (!kpis) {
      let q = supabase
        .from("analytics_events")
        .select("id, name, anon_id, user_id, props, occurred_at", { count: "exact" })
        .order("occurred_at", { ascending: false })
        .limit(5000); // cap

      if (p_from) q = q.gte("occurred_at", p_from);
      if (p_to)   q = q.lte("occurred_at", p_to);

      const { data: rows, error } = await q;
      if (error) throw error;

      const seenAnon = new Set();
      const seenUsers = new Set();
      const counts = { view_item: 0, add_to_cart: 0, begin_checkout: 0, purchase: 0 };

      rows.forEach(r => {
        if (r.anon_id) seenAnon.add(r.anon_id);
        if (r.user_id) seenUsers.add(r.user_id);
        if (counts[r.name] !== undefined) counts[r.name] += 1;
      });

      kpis = {
        total_events: rows.length,
        unique_sessions: seenAnon.size,
        unique_users: seenUsers.size,
        view_item: counts.view_item,
        add_to_cart: counts.add_to_cart,
        begin_checkout: counts.begin_checkout,
        purchase: counts.purchase,
      };
    }

    // ---- Top products
    let topProducts = [];
    let tp = null;
    try {
      tp = await supabase.rpc("analytics_top_products", { p_from, p_to, p_limit: 10 });
      if (!tp.error && Array.isArray(tp.data)) topProducts = tp.data;
    } catch (_) {}

    if (!topProducts.length) {
      let q = supabase
        .from("analytics_events")
        .select("props, occurred_at")
        .eq("name", "add_to_cart")
        .order("occurred_at", { ascending: false })
        .limit(5000);

      if (p_from) q = q.gte("occurred_at", p_from);
      if (p_to)   q = q.lte("occurred_at", p_to);

      const { data: rows, error } = await q;
      if (error) throw error;

      const tally = new Map();
      rows.forEach(r => {
        const title = (r.props && (r.props.title || r.props.item_name)) || "Unknown";
        tally.set(title, (tally.get(title) || 0) + 1);
      });
      topProducts = Array.from(tally.entries())
        .map(([product_title, add_to_cart_count]) => ({ product_title, add_to_cart_count }))
        .sort((a, b) => b.add_to_cart_count - a.add_to_cart_count)
        .slice(0, 10);
    }

    return res.json({ kpis, topProducts });
  } catch (e) {
    console.error("getSummary error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

// GET /api/analytics/daily?from=YYYY-MM-DD&to=YYYY-MM-DD&name=add_to_cart
exports.getDailyCounts = async (req, res) => {
  try {
    const { from, to, name } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    let q = supabase
      .from("analytics_daily_event_counts")
      .select("day, name, count")
      .order("day", { ascending: true });

    if (name)   q = q.eq("name", name);
    if (p_from) q = q.gte("day", p_from);
    if (p_to)   q = q.lte("day", p_to);

    const { data, error } = await q;
    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (e) {
    console.error("getDailyCounts error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

// GET /api/analytics/events?limit=100&offset=0&name=add_to_cart
exports.getEvents = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Number(req.query.offset || 0);
    const name = req.query.name || null;

    let q = supabase
      .from("analytics_events")
      .select("id, occurred_at, name, anon_id, user_id, url, referrer, utm, props")
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (name) q = q.eq("name", name);

    const { data, error } = await q;
    if (error) throw error;

    return res.json({ events: data || [] });
  } catch (e) {
    console.error("getEvents error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const now = new Date();
    const last24hISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last30dISO = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const PAID_PAYMENT_STATUSES = ["PAID", "SUCCESS", "CAPTURED"];
    const PAID_ORDER_STATUSES   = ["PAID", "COMPLETED", "SUCCESS", "FULFILLED"];


    const fetchPaidOrderIds = async (fromISO = null) => {
      let q1 = supabase
        .from("orders")
        .select("id", { count: "exact" })
        .in("payment_status", PAID_PAYMENT_STATUSES);
      if (fromISO) q1 = q1.gte("placed_at", fromISO);
      const { data: p1rows, error: p1err, count: p1count } = await q1;
      if (p1err) throw p1err;

      // 2) Fallback: status if payment_status not used
      let q2 = supabase
        .from("orders")
        .select("id", { count: "exact" })
        .is("payment_status", null)
        .in("status", PAID_ORDER_STATUSES);
      if (fromISO) q2 = q2.gte("placed_at", fromISO);
      const { data: p2rows, error: p2err, count: p2count } = await q2;
      if (p2err) throw p2err;

      const ids = new Set();
      (p1rows || []).forEach(r => ids.add(r.id));
      (p2rows || []).forEach(r => ids.add(r.id));

      return { ids: Array.from(ids), count: (p1count || 0) + (p2count || 0) };
    };

    const [s24, s30, sAll] = await Promise.all([
      fetchPaidOrderIds(last24hISO),
      fetchPaidOrderIds(last30dISO),
      fetchPaidOrderIds(null),
    ]);

    let topProducts = [];
    if (sAll.ids.length > 0) {
      const { data: items, error: itemsErr } = await supabase
        .from("order_items")
        .select("product_id, product_title, qty, order_id")
        .in("order_id", sAll.ids);
      if (itemsErr) throw itemsErr;

      const byProduct = new Map();
      for (const row of items || []) {
        const pid = row.product_id || null;
        const name = row.product_title || "Untitled";
        const qty = Number(row.qty || 0);
        const key = pid || `title:${name}`; 

        const prev = byProduct.get(key) || {
          id: pid,            
          name,               
          image: null,        
          sales: 0,
        };
        prev.sales += qty;
        byProduct.set(key, prev);
      }

      topProducts = Array.from(byProduct.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 6);
    }

    return res.json({
      summary: [
        { name: "Last 24h", sales: s24.count ?? 0 },
        { name: "30 Days",  sales: s30.count ?? 0 },
        { name: "All Time", sales: sAll.count ?? 0 },
      ],
      topProducts,
    });
  } catch (e) {
    console.error("getSalesReport error", e);
    return res.status(500).json({ error: "internal_error", details: e.message });
  }
};