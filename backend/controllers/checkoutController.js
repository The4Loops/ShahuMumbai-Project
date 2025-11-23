// controllers/checkoutController.js
require('dotenv').config();
const sql = require('mssql');
const jwt = require('jsonwebtoken');
const currentCartOwner = require('../utils/currentCartOwner');

function dbReady(req) {
  return req.db && req.db.connected;  // ← FIXED
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
}

// Always INR now; keep function in case you re-enable FX later.
const getExchangeRate = async (_dbPool, _currency = 'INR') => 1;

exports.createOrder = async (req, res) => {
  const token = req.cookies.auth_token;
  const owner = currentCartOwner(req);
  var decoded={};
  if(token){
    decoded = jwt.verify(token, process.env.JWT_SECRET) || {};
  }
  
  const {
    customer,
    currency = 'INR',
    items = [],
    discount_total = 0,
    tax_total = 0,
    shipping_total = 0,
    payment_method,
    meta: extraMeta = {},
  } = req.body || {};

  try {
    if (!customer?.name) {
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
      return res.json({ ok: true, order_id: 1, order_number: 'SM-000001', total, currency: 'INR' });
    }

    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    // Validate items have product_id
    const ids = items.map((it) => it.product_id).filter(Boolean);
    if (ids.length !== items.length) {
      return res.status(400).json({ ok: false, error: 'missing_product_id' });
    }

    // Load products
    const inList = ids.map((_, i) => `@P${i}`).join(',');
    const prodReq = req.db.request();
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

      // Always INR
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
        .input('UserId', sql.NVarChar(1000), decoded.id ? decoded.id.toString() : String(owner))
        .input('CustName', sql.NVarChar(255), String(customer.name))
        .input('CustEmail', sql.NVarChar(255), String(customer.email || ''))
        .input('CustPhoneNo', sql.NVarChar(255), String(customer.phone || ''))
        .input('CustAddress', sql.NVarChar(255), String(customer.address || ''))
        .input('Status', sql.NVarChar(20), 'pending')            // allowed by your CHECK
        .input('PayStatus', sql.NVarChar(20), 'unpaid')          // unpaid → will flip to paid on verify
        .input('Currency', sql.NVarChar(8), 'INR')               // 🔒 INR
        .input('Subtotal', sql.Decimal(18, 2), subtotal)
        .input('Discount', sql.Decimal(18, 2), discount_total || 0)
        .input('Tax', sql.Decimal(18, 2), tax_total || 0)
        .input('Shipping', sql.Decimal(18, 2), shipping_total || 0)
        .input('Total', sql.Decimal(18, 2), total)
        .input(
          'Meta',
          sql.NVarChar(sql.MAX),
          JSON.stringify({
            phone: customer.phone || '',
            address: customer.address || '',
            payment_method,
            cart: items,
            ...extraMeta,
          })
        )
        .input('PlacedAt', sql.DateTime2, new Date());

      const orderIns = await orderReq.query(`
        INSERT INTO dbo.Orders
          (UserId, CustomerName, CustomerEmail,CustomerPhoneNo,CustomerAddress, Status, PaymentStatus, Currency,
           Subtotal, DiscountTotal, TaxTotal, ShippingTotal, Total, Meta, PlacedAt)
        OUTPUT INSERTED.OrderId, INSERTED.OrderNumber
        VALUES
          (@UserId, @CustName, @CustEmail,@CustPhoneNo,@CustAddress, @Status, @PayStatus, @Currency,
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
        currency: 'INR',
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
