const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const sql = require('mssql');

// Helper: merge jsonb meta (fetch row → shallow-merge → update)
async function mergeOrderMetaById(orderId, metaPatch, otherFields = {}) {
  try {
    const result = await req.dbPool.request()
      .input('OrderId', sql.Int, orderId)
      .query('SELECT Meta FROM orders WHERE OrderId = @OrderId');

    if (!result.recordset[0]) return { error: 'order_not_found' };

    const currentMeta = result.recordset[0].Meta ? JSON.parse(result.recordset[0].Meta) : {};
    const nextMeta = { ...currentMeta, ...(metaPatch || {}) };

    let updateQuery = `
      UPDATE orders
      SET Meta = @Meta, UpdatedAt = @UpdatedAt
      WHERE OrderId = @OrderId
    `;
    const parameters = [
      { name: 'OrderId', type: sql.Int, value: orderId },
      { name: 'Meta', type: sql.NVarChar, value: JSON.stringify(nextMeta) },
      { name: 'UpdatedAt', type: sql.DateTime, value: new Date().toISOString() }
    ];

    if (otherFields.PlacedAt) {
      updateQuery += ', PlacedAt = @PlacedAt';
      parameters.push({ name: 'PlacedAt', type: sql.DateTime, value: otherFields.PlacedAt });
    }
    if (otherFields.Status) {
      updateQuery += ', Status = @Status';
      parameters.push({ name: 'Status', type: sql.NVarChar, value: otherFields.Status });
    }
    if (otherFields.PaymentStatus) {
      updateQuery += ', PaymentStatus = @PaymentStatus';
      parameters.push({ name: 'PaymentStatus', type: sql.NVarChar, value: otherFields.PaymentStatus });
    }

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));

    const updateResult = await request.query(updateQuery);

    if (updateResult.rowsAffected[0] === 0) {
      return { error: 'update_failed' };
    }

    return { error: null };
  } catch (e) {
    console.error('mergeOrderMetaById error:', e);
    return { error: e.message };
  }
}

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { order_number } = req.body;
    if (!order_number) return res.status(400).json({ message: 'missing_order_number' });

    // 1) Fetch order by order_number
    const orderResult = await req.dbPool.request()
      .input('OrderNumber', sql.NVarChar, order_number)
      .query(`
        SELECT 
          OrderId, OrderNumber, Total, Currency, Meta, PaymentStatus
        FROM orders
        WHERE OrderNumber = @OrderNumber
      `);

    const order = orderResult.recordset[0];
    if (!order) return res.status(404).json({ message: 'order_not_found' });
    if (String(order.PaymentStatus || '').toLowerCase() === 'paid') {
      return res.status(409).json({ message: 'already_paid' });
    }

    const amountPaise = Math.round(Number(order.Total) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ message: 'invalid_amount' });
    }

    // 2) Create Razorpay Order
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: order.Currency || 'INR',
      receipt: order.OrderNumber,
      notes: { order_number: order.OrderNumber }
    });

    // 3) Save in meta + mark payment_status pending
    const metaPatch = {
      razorpay_order_id: rzpOrder.id,
      razorpay_amount: amountPaise,
    };
    const patch = {
      PaymentStatus: 'pending',
      Status: 'pending',
      UpdatedAt: new Date().toISOString(),
    };

    const { error: updErr } = await mergeOrderMetaById(order.OrderId, metaPatch, patch);
    if (updErr) return res.status(500).json({ message: 'failed_to_save_razorpay_order' });

    return res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.OrderNumber,
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
    const ordersResult = await req.dbPool.request()
      .input('rzpOrderId', sql.NVarChar, razorpay_order_id)
      .query(`
        SELECT OrderId, OrderNumber, PlacedAt
        FROM orders
        WHERE JSON_VALUE(Meta, '$.razorpay_order_id') = @rzpOrderId
      `);

    const orders = ordersResult.recordset;
    if (!orders || orders.length === 0) {
      return res.status(404).json({ ok: false, message: 'order_not_found' });
    }
    const row = orders[0];

    // 3) Merge meta + set payment_status
    const patch = {
      PaymentStatus: ok ? 'paid' : 'failed',
      Status: ok ? 'paid' : 'pending',
      UpdatedAt: new Date().toISOString(),
    };
    if (ok && !row.PlacedAt) {
      patch.PlacedAt = new Date().toISOString();
    }
    const metaPatch = {
      razorpay_payment_id,
      razorpay_signature,
      verify_ok: ok,
    };

    const { error: updErr } = await mergeOrderMetaById(row.OrderId, metaPatch, patch);
    if (updErr) return res.status(500).json({ ok: false, message: 'update_failed' });

    if (!ok) return res.status(400).json({ ok: false, message: 'signature_mismatch' });
    return res.json({ ok: true, order_number: row.OrderNumber });
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
    const ordersResult = await req.dbPool.request()
      .input('rzpOrderId', sql.NVarChar, rzpOrderId)
      .query(`
        SELECT OrderId, OrderNumber
        FROM orders
        WHERE JSON_VALUE(Meta, '$.razorpay_order_id') = @rzpOrderId
      `);

    const orders = ordersResult.recordset;
    if (!orders || orders.length === 0) {
      console.log('Webhook: Order not found for rzpOrderId:', rzpOrderId);
      return res.json({ received: true });
    }
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
      ...(status ? { Status: status } : {}),
      ...(payment_status ? { PaymentStatus: payment_status } : {}),
      UpdatedAt: new Date().toISOString(),
    };

    const { error: updErr } = await mergeOrderMetaById(row.OrderId, metaPatch, patch);
    if (updErr) console.error('webhook update error:', updErr);

    return res.json({ received: true });
  } catch (e) {
    console.error('payments.webhook error:', e);
    return res.status(500).send('webhook_error');
  }
};