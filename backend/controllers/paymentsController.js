// controllers/paymentsController.js
require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const sql = require('mssql');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/** Merge JSON Meta and optionally update other fields on dbo.Orders */
async function mergeOrderMetaById(dbPool, orderId, metaPatch = {}, otherFields = {}) {
  try {
    const sel = await dbPool.request()
      .input('OrderId', sql.Int, orderId)
      .query('SELECT Meta FROM dbo.Orders WHERE OrderId = @OrderId');

    if (!sel.recordset[0]) return { error: 'order_not_found' };

    let currentMeta = {};
    try { currentMeta = sel.recordset[0].Meta ? JSON.parse(sel.recordset[0].Meta) : {}; } catch {}

    const nextMeta = { ...currentMeta, ...metaPatch };

    const setParts = ['Meta = @Meta', 'UpdatedAt = @UpdatedAt'];
    const req = dbPool.request()
      .input('OrderId', sql.Int, orderId)
      .input('Meta', sql.NVarChar(sql.MAX), JSON.stringify(nextMeta))
      .input('UpdatedAt', sql.DateTime2, otherFields.UpdatedAt || new Date());

    if (otherFields.PlacedAt) {
      setParts.push('PlacedAt = @PlacedAt');
      req.input('PlacedAt', sql.DateTime2, otherFields.PlacedAt);
    }
    if (otherFields.Status) {
      setParts.push('Status = @Status');
      req.input('Status', sql.NVarChar(20), otherFields.Status);
    }
    if (otherFields.PaymentStatus) {
      setParts.push('PaymentStatus = @PaymentStatus');
      req.input('PaymentStatus', sql.NVarChar(20), otherFields.PaymentStatus);
    }

    const updateSql = `
      UPDATE dbo.Orders
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

async function getExistingRzpOrderId(dbPool, orderId) {
  const r = await dbPool.request()
    .input('OrderId', sql.Int, orderId)
    .query(`
      SELECT JSON_VALUE(Meta, '$.razorpay_order_id') AS RzpOrderId, PaymentStatus
      FROM dbo.Orders
      WHERE OrderId = @OrderId
    `);
  const row = r.recordset?.[0];
  if (!row) return null;
  if (row.RzpOrderId && String(row.PaymentStatus || '').toLowerCase() !== 'paid') {
    return row.RzpOrderId;
  }
  return null;
}

/** POST /api/payments/create-order { order_number } */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { order_number } = req.body || {};
    if (!order_number) return res.status(400).json({ message: 'missing_order_number' });

    const orderRes = await req.dbPool.request()
      .input('OrderNumber', sql.NVarChar(50), order_number)
      .query(`
        SELECT OrderId, OrderNumber, Total, Currency, Meta, PaymentStatus
        FROM dbo.Orders
        WHERE OrderNumber = @OrderNumber
      `);

    const order = orderRes.recordset[0];
    if (!order) return res.status(404).json({ message: 'order_not_found' });
    if (String(order.PaymentStatus || '').toLowerCase() === 'paid') {
      return res.status(409).json({ message: 'already_paid' });
    }

    // Reuse existing RZP order if present & unpaid
    let rzpOrder;
    const existing = await getExistingRzpOrderId(req.dbPool, order.OrderId);
    if (existing) {
      try { rzpOrder = await razorpay.orders.fetch(existing); } catch {}
    }

    // Create new if needed
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
        payment_capture: 1,
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
      ok: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.OrderNumber,
      rzp: { order_id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency },
    });
  } catch (e) {
    console.error('payments.createRazorpayOrder error:', e);
    return res.status(500).json({ message: 'internal_error' });
  }
};

/** POST /api/payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature } */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, message: 'missing_fields' });
    }

    // Verify signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const ok = expected === razorpay_signature;

    // Find our order by RZP order id in Meta
    const ordersRes = await req.dbPool.request()
      .input('rzpOrderId', sql.NVarChar(100), razorpay_order_id)
      .query(`
        SELECT OrderId, OrderNumber, PlacedAt, PaymentStatus
        FROM dbo.Orders
        WHERE JSON_VALUE(Meta, '$.razorpay_order_id') = @rzpOrderId
      `);

    const ord = ordersRes.recordset[0];
    if (!ord) return res.status(404).json({ ok: false, message: 'order_not_found' });

    if (!ok) {
      // Record failed verify and keep pending
      await mergeOrderMetaById(req.dbPool, ord.OrderId, {
        razorpay_payment_id, razorpay_signature, verify_ok: false,
      }, {
        PaymentStatus: 'unpaid',
        Status: 'pending',
        UpdatedAt: new Date(),
      });
      return res.status(400).json({ ok: false, message: 'signature_mismatch' });
    }

    // If already paid, just return ok (idempotent)
    if (String(ord.PaymentStatus || '').toLowerCase() === 'paid') {
      return res.json({ ok: true, order_number: ord.OrderNumber });
    }

    // Transaction: decrement stock then mark paid/confirmed
    const tx = new sql.Transaction(req.dbPool);
    await tx.begin();

    try {
      // Load items
      const it = await new sql.Request(tx)
        .input('OrderId', sql.Int, ord.OrderId)
        .query(`
          SELECT ProductId, Qty
          FROM dbo.OrderItems
          WHERE OrderId = @OrderId
        `);

      // Decrement stock guarded
      for (const row of it.recordset) {
        const upd = await new sql.Request(tx)
          .input('ProductId', sql.Int, row.ProductId)
          .input('Qty', sql.Int, row.Qty)
          .query(`
            UPDATE dbo.Products
            SET Stock = Stock - @Qty
            WHERE ProductId = @ProductId AND Stock >= @Qty
          `);
        if (upd.rowsAffected[0] === 0) {
          throw Object.assign(new Error('insufficient_stock'), { product_id: row.ProductId });
        }
      }

      // Update order -> paid/confirmed; store payment id in meta
      await new sql.Request(tx)
        .input('OrderId', sql.Int, ord.OrderId)
        .input('RzpPaymentId', sql.NVarChar(100), razorpay_payment_id)
        .query(`
          UPDATE dbo.Orders
          SET PaymentStatus = 'paid',
              Status = 'confirmed',
              PlacedAt = ISNULL(PlacedAt, SYSUTCDATETIME()),
              UpdatedAt = SYSUTCDATETIME(),
              Meta = CASE
                WHEN ISJSON(Meta) = 1
                  THEN JSON_MODIFY(Meta, '$.rzp_payment_id', @RzpPaymentId)
                ELSE '{ "rzp_payment_id": "' + @RzpPaymentId + '" }'
              END
          WHERE OrderId = @OrderId
        `);

      await tx.commit();

      // Also merge outside tx to keep extra fields if you want
      await mergeOrderMetaById(req.dbPool, ord.OrderId, {
        razorpay_order_id, razorpay_payment_id, razorpay_signature, verify_ok: true,
      }, {});

      return res.json({ ok: true, order_number: ord.OrderNumber });
    } catch (errTx) {
      try { await tx.rollback(); } catch {}
      if (errTx?.message === 'insufficient_stock') {
        return res.status(409).json({ ok: false, message: 'insufficient_stock' });
      }
      console.error('verifyPayment tx error:', errTx);
      return res.status(409).json({ ok: false, message: errTx?.message || 'verify_failed' });
    }
  } catch (e) {
    console.error('payments.verifyPayment error:', e);
    return res.status(500).json({ ok: false, message: 'internal_error' });
  }
};

/** Webhook (optional, raw body) */
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
    // You can upsert webhook info to Meta similarly if you like
    res.json({ received: true });
  } catch (e) {
    console.error('payments.webhook error:', e);
    return res.status(500).send('webhook_error');
  }
};
