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
// Returns KPIs + top products. Tries RPCs if present; falls back gracefully.
exports.getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const p_from = toStart(from);
    const p_to   = toEnd(to);

    // ---- Try RPC 'analytics_kpis' (if you ran the optional SQL)
    let kpis = null;
    try {
      const k = await supabase.rpc("analytics_kpis", { p_from, p_to });
      if (!k.error && Array.isArray(k.data) && k.data.length) {
        kpis = k.data[0];
      }
    } catch (_) {}

    // ---- Fallback: compute KPIs in Node by fetching a reasonable window
    if (!kpis) {
      // fetch capped number of events (admin view; keep simple)
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

    // ---- Top products (prefer RPC; fallback to simple Node tally)
    let topProducts = [];
    let tp = null;
    try {
      tp = await supabase.rpc("analytics_top_products", { p_from, p_to, p_limit: 10 });
      if (!tp.error && Array.isArray(tp.data)) topProducts = tp.data;
    } catch (_) {}

    if (!topProducts.length) {
      // fallback: fetch add_to_cart events and tally title
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
