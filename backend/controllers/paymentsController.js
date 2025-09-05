// controllers/paymentsController.js
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const supabase = require('../config/supabaseClient');

// Helper: merge jsonb meta (fetch row → shallow-merge → update)
async function mergeOrderMetaById(orderId, metaPatch, otherFields = {}) {
  const { data: rows, error: gErr } = await supabase
    .from('orders')
    .select('id, meta')
    .eq('id', orderId)
    .limit(1);

  if (gErr || !rows || rows.length === 0) return { error: gErr || 'order_not_found' };

  const currentMeta = rows[0].meta || {};
  const nextMeta = { ...currentMeta, ...(metaPatch || {}) };

  const { error: uErr } = await supabase
    .from('orders')
    .update({ meta: nextMeta, ...otherFields })
    .eq('id', orderId);

  return { error: uErr || null };
}

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { order_number } = req.body;
    if (!order_number) return res.status(400).json({ message: 'missing_order_number' });

    // 1) Fetch order by order_number
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, total, currency, meta, payment_status')
      .eq('order_number', order_number)
      .single();

    if (orderErr || !order) return res.status(404).json({ message: 'order_not_found' });
    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      return res.status(409).json({ message: 'already_paid' });
    }

    const amountPaise = Math.round(Number(order.total) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ message: 'invalid_amount' });
    }

    // 2) Create Razorpay Order
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: order.currency || 'INR',
      receipt: order.order_number,
      notes: { order_number: order.order_number }
    });

    // 3) Save in meta + mark payment_status pending
    const { error: updErr } = await supabase
      .from('orders')
      .update({
        meta: { ...(order.meta || {}), razorpay_order_id: rzpOrder.id, razorpay_amount: amountPaise },
        payment_status: 'pending',
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updErr) return res.status(500).json({ message: 'failed_to_save_razorpay_order' });

    return res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.order_number,
      rzp: { order_id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency }
    });
  } catch (e) {
    console.error('payments.createRazorpayOrder error:', e);
    return res.status(500).json({ message: 'internal_error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, message: 'missing_fields' });
    }

    // 1) Signature HMAC
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const ok = expected === razorpay_signature;

    // 2) Find our order by meta->razorpay_order_id
    const { data: orders, error: findErr } = await supabase
      .from('orders')
      .select('id, order_number, placed_at')
      .contains('meta', { razorpay_order_id });

    if (findErr || !orders || orders.length === 0) {
      return res.status(404).json({ ok: false, message: 'order_not_found' });
    }
    const row = orders[0];

    // 3) Merge meta + set payment_status
    const patch = {
      payment_status: ok ? 'paid' : 'failed',
      status: ok ? 'paid' : 'pending',
      updated_at: new Date().toISOString(),
      ...(ok && !row.placed_at ? { placed_at: new Date().toISOString() } : {}),
    };
    const metaPatch = {
      razorpay_payment_id,
      razorpay_signature,
      verify_ok: ok,
    };

    const { error: updErr } = await mergeOrderMetaById(row.id, metaPatch, patch);
    if (updErr) return res.status(500).json({ ok: false, message: 'update_failed' });

    if (!ok) return res.status(400).json({ ok: false, message: 'signature_mismatch' });
    return res.json({ ok: true, order_number: row.order_number });
  } catch (e) {
    console.error('payments.verifyPayment error:', e);
    return res.status(500).json({ ok: false, message: 'internal_error' });
  }
};

exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const digest = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest('hex');

    if (digest !== signature) return res.status(400).send('invalid_signature');

    const event = JSON.parse(req.rawBody.toString());
    const payment = event?.payload?.payment?.entity;
    const rzpOrderId = payment?.order_id;

    if (!rzpOrderId) return res.json({ received: true });

    // Find order by rzp order id
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number')
      .contains('meta', { razorpay_order_id: rzpOrderId });

    if (!orders || orders.length === 0) return res.json({ received: true });
    const row = orders[0];

    let status, payment_status;
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      status = 'paid'; payment_status = 'paid';
    } else if (event.event?.includes('failed')) {
      status = 'pending'; payment_status = 'failed';
    } else if (event.event?.startsWith('refund.')) {
      status = 'paid'; payment_status = 'refunded';
    }

    const metaPatch = {
      webhook_event: event.event,
      last_webhook_at: new Date().toISOString(),
      last_webhook_id: event.id,
      last_webhook_payment_id: payment?.id || null,
    };

    const patch = {
      ...(status ? { status } : {}),
      ...(payment_status ? { payment_status } : {}),
      updated_at: new Date().toISOString(),
    };

    const { error: updErr } = await mergeOrderMetaById(row.id, metaPatch, patch);
    if (updErr) console.error('webhook update error:', updErr);

    return res.json({ received: true });
  } catch (e) {
    console.error('payments.webhook error:', e);
    return res.status(500).send('webhook_error');
  }
};
