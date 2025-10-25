require('dotenv').config();
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const sql = require('mssql');

/**
 * Merge JSON Meta and optionally update other fields.
 * @param {sql.ConnectionPool} dbPool
 * @param {number} orderId
 * @param {object} metaPatch
 * @param {object} otherFields { PlacedAt?: Date, Status?: string, PaymentStatus?: string, UpdatedAt?: Date }
 */
async function mergeOrderMetaById(dbPool, orderId, metaPatch = {}, otherFields = {}) {
  try {
    const sel = await dbPool.request()
      .input('OrderId', sql.BigInt, orderId)
      .query('SELECT Meta FROM orders WHERE OrderId = @OrderId');

    if (!sel.recordset[0]) return { error: 'order_not_found' };

    const currentMeta = sel.recordset[0].Meta ? JSON.parse(sel.recordset[0].Meta) : {};
    const nextMeta    = { ...currentMeta, ...metaPatch };

    const setParts = ['Meta = @Meta', 'UpdatedAt = @UpdatedAt'];
    const req = dbPool.request()
      .input('OrderId', sql.Int, orderId)
      .input('Meta', sql.NVarChar(sql.MAX), JSON.stringify(nextMeta))
      .input('UpdatedAt', sql.DateTime, otherFields.UpdatedAt || new Date());

    if (otherFields.PlacedAt) {
      setParts.push('PlacedAt = @PlacedAt');
      req.input('PlacedAt', sql.DateTime, otherFields.PlacedAt);
    }
    if (otherFields.Status) {
      setParts.push('Status = @Status');
      req.input('Status', sql.NVarChar, otherFields.Status);
    }
    if (otherFields.PaymentStatus) {
      setParts.push('PaymentStatus = @PaymentStatus');
      req.input('PaymentStatus', sql.NVarChar, otherFields.PaymentStatus);
    }

    const updateSql = `
      UPDATE orders
      SET ${setParts.join(', ')}
      WHERE OrderId = @OrderId
    `;

    const upd = await req.query(updateSql);
    if (!upd.rowsAffected[0]) return { error: 'update_failed' };

    return { error: null };
  } catch (e) {
    console.error('mergeOrderMetaById error:', e);
    return { error: e.message || 'merge_error' };
  }
}

/** Return existing open RZP order id for our OrderId if present, else null. */
async function getExistingRzpOrderId(dbPool, orderId) {
  const r = await dbPool.request()
    .input('OrderId', sql.BigInt, orderId)
    .query(`
      SELECT JSON_VALUE(Meta, '$.razorpay_order_id') AS rzpOrderId, PaymentStatus
      FROM orders
      WHERE OrderId = @OrderId
    `);
  if (!r.recordset[0]) return null;
  const { rzpOrderId, PaymentStatus } = r.recordset[0];
  if (rzpOrderId && String(PaymentStatus || '').toLowerCase() !== 'paid') {
    return rzpOrderId;
  }
  return null;
}

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { order_number } = req.body;
    if (!order_number) return res.status(400).json({ message: 'missing_order_number' });

    // 1) Fetch order by order_number
    const orderRes = await req.dbPool.request()
      .input('OrderNumber', sql.NVarChar, order_number)
      .query(`
        SELECT OrderId, OrderNumber, Total, Currency, Meta, PaymentStatus
        FROM orders
        WHERE OrderNumber = @OrderNumber
      `);

    const order = orderRes.recordset[0];
    if (!order) return res.status(404).json({ message: 'order_not_found' });
    if (String(order.PaymentStatus || '').toLowerCase() === 'paid') {
      return res.status(409).json({ message: 'already_paid' });
    }

    // 2) Reuse existing RZP order if present
    let rzpOrder;
    const existing = await getExistingRzpOrderId(req.dbPool, order.OrderId);
    if (existing) {
      try {
        rzpOrder = await razorpay.orders.fetch(existing);
      } catch {
        // If fetch fails (e.g. stale id), we’ll create a new one below.
      }
    }

    // 3) Create new Razorpay Order if needed
    if (!rzpOrder) {
      const amountPaise = Math.round(Number(order.Total) * 100);
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        return res.status(400).json({ message: 'invalid_amount' });
      }
      const currency = (order.Currency || 'INR').toUpperCase();

      rzpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency,
        receipt: order.OrderNumber,
        notes: { order_number: order.OrderNumber },
      });

      const metaPatch = {
        razorpay_order_id: rzpOrder.id,
        razorpay_amount: amountPaise,
        razorpay_currency: currency,
      };
      const patch = {
        PaymentStatus: 'unpaid',
        Status: 'pending',
        UpdatedAt: new Date(),
      };

      const { error: updErr } = await mergeOrderMetaById(req.dbPool, order.OrderId, metaPatch, patch);
      if (updErr) return res.status(500).json({ message: 'failed_to_save_razorpay_order' });
    }

    return res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.OrderNumber,
      rzp: { order_id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency },
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

    // 1) Signature HMAC (client-side verify step)
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const ok = expected === razorpay_signature;

    // 2) Find our order by meta->razorpay_order_id
    const ordersRes = await req.dbPool.request()
      .input('rzpOrderId', sql.NVarChar, razorpay_order_id)
      .query(`
        SELECT OrderId, OrderNumber, PlacedAt
        FROM orders
        WHERE JSON_VALUE(Meta, '$.razorpay_order_id') = @rzpOrderId
      `);

    const row = ordersRes.recordset[0];
    if (!row) return res.status(404).json({ ok: false, message: 'order_not_found' });

    const patch = {
      PaymentStatus: ok ? 'paid' : 'unpaid',
      Status: ok ? 'paid' : 'pending',
      UpdatedAt: new Date(),
      ...(ok && !row.PlacedAt ? { PlacedAt: new Date() } : {}),
    };
    const metaPatch = {
      razorpay_payment_id,
      razorpay_signature,
      verify_ok: ok,
    };

    const { error: updErr } = await mergeOrderMetaById(req.dbPool, row.OrderId, metaPatch, patch);
    if (updErr) return res.status(500).json({ ok: false, message: 'update_failed' });

    if (!ok) return res.status(400).json({ ok: false, message: 'signature_mismatch' });
    return res.json({ ok: true, order_number: row.OrderNumber });
  } catch (e) {
    console.error('payments.verifyPayment error:', e);
    return res.status(500).json({ ok: false, message: 'internal_error' });
  }
};

// Razorpay Webhook: needs RAW BODY for HMAC
// Ensure the route uses express.raw({ type: '*/*' }) before any JSON parser.
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const digest = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(req.rawBody) // Buffer
      .digest('hex');

    if (digest !== signature) {
      console.error('Webhook signature mismatch');
      return res.status(400).send('invalid_signature');
    }

    const event = JSON.parse(req.rawBody.toString());
    const payment = event?.payload?.payment?.entity;
    const rzpOrderId = payment?.order_id;

    if (!rzpOrderId) {
      console.log('Webhook: No rzpOrderId, skipping');
      return res.json({ received: true });
    }

    // Find order by meta->razorpay_order_id
    const ordersRes = await req.dbPool.request()
      .input('rzpOrderId', sql.NVarChar, rzpOrderId)
      .query(`
        SELECT OrderId, OrderNumber
        FROM orders
        WHERE JSON_VALUE(Meta, '$.razorpay_order_id') = @rzpOrderId
      `);

    const row = ordersRes.recordset[0];
    if (!row) {
      console.log('Webhook: Order not found for rzpOrderId:', rzpOrderId);
      return res.json({ received: true });
    }

    let status, payment_status;
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      status = 'paid'; payment_status = 'paid';
    } else if (event.event?.includes('failed')) {
      status = 'pending'; payment_status = 'unpaid';
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
      ...(status ? { Status: status } : {}),
      ...(payment_status ? { PaymentStatus: payment_status } : {}),
      UpdatedAt: new Date(),
    };

    const { error: updErr } = await mergeOrderMetaById(req.dbPool, row.OrderId, metaPatch, patch);
    if (updErr) console.error('webhook update error:', updErr);

    return res.json({ received: true });
  } catch (e) {
    console.error('payments.webhook error:', e);
    return res.status(500).send('webhook_error');
  }
};
