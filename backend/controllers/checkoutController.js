// controllers/checkoutController.js
require('dotenv').config();
const sql = require('mssql');
const crypto = require('crypto');

function dbReady(req) {
  return req.dbPool && req.dbPool.connected;
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
}

const getExchangeRate = async (dbPool, currency = 'USD') => {
  try {
    const result = await dbPool
      .request()
      .input('CurrencyCode', sql.VarChar(3), String(currency || 'USD').toUpperCase())
      .query('SELECT ExchangeRate FROM Currencies WHERE CurrencyCode = @CurrencyCode');

    return result.recordset[0]?.ExchangeRate || 1.0;
  } catch (err) {
    console.error('Exchange rate lookup failed:', err);
    return 1.0;
  }
};

/**
 * POST /api/checkout/order
 * Creates an internal order record with PaymentStatus='unpaid'
 */
exports.createOrder = async (req, res) => {
  const {
    customer,
    currency = 'USD',
    items = [],
    discount_total = 0,
    tax_total = 0,
    shipping_total = 0,
    payment_method,
    meta: extraMeta = {},
  } = req.body || {};

  try {
    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ ok: false, error: 'missing_customer' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'no_items' });
    }

    // Dev short-circuit without DB
    if (!dbReady(req) && devFakeAllowed()) {
      const subtotal = items.reduce(
        (s, it) => s + (Number(it.unit_price || 0) * Number(it.qty || 1)),
        0
      );
      const total = Number(
        (subtotal - Number(discount_total || 0) + Number(tax_total || 0) + Number(shipping_total || 0)).toFixed(2)
      );
      return res.json({ ok: true, order_id: 1, order_number: 'SM-000001', total, currency });
    }

    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    // Validate items have product_id
    const ids = items.map((it) => it.product_id).filter(Boolean);
    if (ids.length !== items.length) {
      return res.status(400).json({ ok: false, error: 'missing_product_id' });
    }

    // Load products
    const inList = ids.map((_, i) => `@P${i}`).join(',');
    const prodReq = req.dbPool.request();
    ids.forEach((id, i) => prodReq.input(`P${i}`, sql.Int, id));

    const prodRes = await prodReq.query(`
      SELECT ProductId AS Id, Name, Price, DiscountPrice, Stock, IsActive
      FROM dbo.Products
      WHERE ProductId IN (${inList})
    `);

    const dbProducts = prodRes.recordset || [];
    const byId = new Map(dbProducts.map((p) => [String(p.Id), p]));
    if (dbProducts.length !== ids.length) {
      const missing = ids.filter((id) => !byId.has(String(id)));
      return res.status(404).json({ ok: false, error: 'some_products_not_found', missing });
    }

    // Build lines + totals
    let subtotal = 0;
    const normalizedItems = [];

    for (const it of items) {
      const p = byId.get(String(it.product_id));
      if (!p) {
        return res.status(404).json({ ok: false, error: 'product_not_found', product_id: it.product_id });
      }

      const inactive = (p.IsActive === 0 || p.IsActive === 'N' || p.IsActive === false);
      if (inactive) {
        return res.status(400).json({ ok: false, error: 'product_inactive', product_id: p.Id });
      }

      const qty = Math.max(1, Number(it.qty || 1));
      const baseUnitPrice = Number(p.DiscountPrice ?? p.Price);
      if (!Number.isFinite(baseUnitPrice) || baseUnitPrice < 0) {
        return res.status(400).json({ ok: false, error: 'invalid_price', product_id: p.Id });
      }

      const unit_price = Number((baseUnitPrice * exchangeRate).toFixed(2));
      const line_total = Number((unit_price * qty).toFixed(2));
      subtotal += line_total;

      normalizedItems.push({
        product_id: p.Id,
        product_title: it.product_title || p.Name,
        unit_price,
        qty,
        line_total,
        meta: it.meta ?? {},
      });
    }

    const total = Number(
      (subtotal - Number(discount_total || 0) + Number(tax_total || 0) + Number(shipping_total || 0)).toFixed(2)
    );

    // Transaction: insert Orders + OrderItems
    const tx = new sql.Transaction(req.dbPool);
    await tx.begin();

    try {
      const orderReq = new sql.Request(tx);
      orderReq
        .input('UserId', sql.Int, null)
        .input('CustName', sql.NVarChar(255), String(customer.name))
        .input('CustEmail', sql.NVarChar(255), String(customer.email))
        // Keep your Orders.Status as 'pending' (no CHECK shown on this)
        .input('Status', sql.NVarChar(20), 'pending')
        // ✅ PaymentStatus must satisfy your CHECK: unpaid|paid|partial|refunded
        .input('PayStatus', sql.NVarChar(20), 'unpaid')
        .input('Currency', sql.NVarChar(8), String(currency || 'USD').toUpperCase())
        .input('Subtotal', sql.Decimal(18, 2), subtotal)
        .input('Discount', sql.Decimal(18, 2), discount_total || 0)
        .input('Tax', sql.Decimal(18, 2), tax_total || 0)
        .input('Shipping', sql.Decimal(18, 2), shipping_total || 0)
        .input('Total', sql.Decimal(18, 2), total)
        .input(
          'Meta',
          sql.NVarChar(sql.MAX),
          JSON.stringify({
            phone: customer.phone,
            address: customer.address,
            payment_method,
            cart: items,
            ...extraMeta,
          })
        ) // <-- fixed: removed the extra ')'
        .input('PlacedAt', sql.DateTime2, new Date());

      const orderIns = await orderReq.query(`
        INSERT INTO dbo.Orders
          (UserId, CustomerName, CustomerEmail, Status, PaymentStatus, Currency,
           Subtotal, DiscountTotal, TaxTotal, ShippingTotal, Total, Meta, PlacedAt)
        OUTPUT INSERTED.OrderId, INSERTED.OrderNumber
        VALUES
          (@UserId, @CustName, @CustEmail, @Status, @PayStatus, @Currency,
           @Subtotal, @Discount, @Tax, @Shipping, @Total, @Meta, @PlacedAt)
      `);

      const row = orderIns.recordset?.[0];
      if (!row) throw new Error('order_insert_failed');

      const orderId = row.OrderId;
      const orderNumber = row.OrderNumber;

      // Insert OrderItems
      for (const it of normalizedItems) {
        await new sql.Request(tx)
          .input('OrderId', sql.Int, orderId)
          .input('ProductId', sql.Int, it.product_id)
          .input('Title', sql.NVarChar(255), it.product_title)
          .input('UnitPrice', sql.Decimal(18, 2), it.unit_price)
          .input('Qty', sql.Int, it.qty)
          .input('LineTotal', sql.Decimal(18, 2), it.line_total)
          .input('Meta', sql.NVarChar(sql.MAX), JSON.stringify(it.meta || {}))
          .query(`
            INSERT INTO dbo.OrderItems
              (OrderId, ProductId, ProductTitle, UnitPrice, Qty, LineTotal, Meta)
            VALUES
              (@OrderId, @ProductId, @Title, @UnitPrice, @Qty, @LineTotal, @Meta)
          `);
      }

      await tx.commit();
      return res.json({
        ok: true,
        order_id: orderId,
        order_number: orderNumber,
        total,
        currency: String(currency || 'USD').toUpperCase(),
      });
    } catch (inner) {
      try { await tx.rollback(); } catch {}
      if (inner?.message === 'order_insert_failed') {
        return res.status(500).json({ ok: false, error: 'order_insert_failed' });
      }
      console.error('createOrder tx error:', inner);
      return res.status(500).json({ ok: false, error: 'internal_error', detail: inner?.message });
    }
  } catch (e) {
    console.error('checkout.createOrder error', e);
    return res.status(500).json({ ok: false, error: 'internal_error', detail: e?.message });
  }
};

/**
 * POST /api/checkout/verify
 * Called after Razorpay Checkout returns success;
 * verifies signature and marks order as 'paid'.
 * Expect body: { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
exports.verifyPayment = async (req, res) => {
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  try {
    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ ok: false, error: 'invalid_signature' });
    }

    // ✅ Update to 'paid'
    await req.dbPool.request()
      .input('OrderId', sql.Int, parseInt(order_id, 10))
      .input('PaymentId', sql.NVarChar(64), razorpay_payment_id)
      .query(`
        UPDATE dbo.Orders
        SET PaymentStatus = 'paid',
            RazorpayPaymentId = @PaymentId,
            PaidAt = GETUTCDATE()
        WHERE OrderId = @OrderId
      `);

    return res.json({ ok: true, status: 'paid' });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error', detail: err.message });
  }
};
