// controllers/ordersController.js
const supabase = require("../config/supabaseClient");

// GET /api/orders?status=All|Pending|Shipped|Delivered&q=&limit=50&offset=0
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

    let queryBuilder = supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, fulfillment_status, placed_at', { count: 'exact' })
      .order('placed_at', { ascending: false });

    if (status && status !== 'All') {
      queryBuilder = queryBuilder.eq('fulfillment_status', status.toLowerCase());
    }

    if (q) {
      // search by order_number or customer_name (case-insensitive)
      const like = `%${q}%`;
      queryBuilder = queryBuilder.or(`order_number.ilike.${like},customer_name.ilike.${like}`);
    }

    // pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    // Map to minimal shape the UI expects
    const orders = (data || []).map(o => ({
      id: o.order_number,          // UI shows "Order ID" like "INV-000123"
      customer: o.customer_name || o.customer_email || 'Guest',
      status: (o.fulfillment_status || 'pending').replace(/^\w/, c => c.toUpperCase()), // Pending/Shipped/Delivered
      placed_at: o.placed_at
    }));

    return res.json({ orders, total: count ?? orders.length });
  } catch (e) {
    console.error('orders.listOrders error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// PATCH /api/orders/:orderNumber/status  { fulfillment_status: "Pending|Shipped|Delivered" }
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

    const patch = { fulfillment_status: normalized, updated_at: new Date().toISOString() };
    if (normalized === 'shipped') patch.shipped_at = new Date().toISOString();
    if (normalized === 'delivered') patch.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('order_number', orderNumber)
      .select('order_number, fulfillment_status, shipped_at, delivered_at')
      .single();

    if (error) throw error;
    return res.json({ ok: true, order: data });
  } catch (e) {
    console.error('orders.updateFulfillmentStatus error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};
