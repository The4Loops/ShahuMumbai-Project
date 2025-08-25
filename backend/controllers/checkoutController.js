// controllers/checkoutController.js
const supabase = require("../config/supabaseClient");

exports.createOrder = async (req, res) => {
  try {
    const {
      customer,          // { name, email, phone, address }
      currency = 'INR',
      items = [],        // [{ product_id?, product_title, unit_price, qty, meta? }]
      discount_total = 0,
      tax_total = 0,
      shipping_total = 0,
      payment_status = 'paid',
      status = 'paid',
      payment_method,    // 'card'|'upi'|'net_banking' etc.
    } = req.body;

    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ error: 'missing_customer' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'no_items' });
    }

    const subtotal = items.reduce((s, it) => s + Number(it.unit_price || 0) * Number(it.qty || 1), 0);
    const total = subtotal - Number(discount_total || 0) + Number(tax_total || 0) + Number(shipping_total || 0);

    // 1) Insert order
    const { data: orderIns, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        user_id: null,
        customer_name: customer.name,
        customer_email: customer.email,
        status,
        payment_status,
        currency,
        subtotal,
        discount_total,
        tax_total,
        shipping_total,
        total,
        meta: {
          phone: customer.phone,
          address: customer.address,
          payment_method,
        },
      }])
      .select('id, order_number')
      .single();
    if (orderErr) throw orderErr;

    const orderId = orderIns.id;

    // 2) Insert order items
    const orderItemsPayload = items.map((it) => ({
      order_id: orderId,
      product_id: it.product_id ?? null,
      product_title: it.product_title,
      unit_price: Number(it.unit_price || 0),
      qty: Number(it.qty || 1),
      line_total: Number(it.unit_price || 0) * Number(it.qty || 1),
      meta: it.meta ?? {},
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsErr) {
      // cleanup in case of failure
      await supabase.from('orders').delete().eq('id', orderId);
      throw itemsErr;
    }

    // 3) Decrement stock for each item that has a product_id
    for (const it of orderItemsPayload) {
      if (!it.product_id) continue;
      const { error: decErr } = await supabase.rpc('decrement_stock', {
        p_id: it.product_id,
        p_qty: it.qty,
      });
      if (decErr) {
        // rollback: delete items & order if any stock decrement fails
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);

        // 409 conflict is a good fit for insufficient stock
        if (String(decErr.message || '').includes('insufficient_stock')) {
          return res.status(409).json({ error: 'insufficient_stock', product_id: it.product_id });
        }
        throw decErr;
      }
    }

    return res.json({
      ok: true,
      order_id: orderId,
      order_number: orderIns.order_number,
      total,
    });
  } catch (e) {
    console.error('checkout.createOrder error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};
