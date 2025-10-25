const sql = require('mssql');

// Helper to get exchange rate from DB
const getExchangeRate = async (dbPool, currency = 'USD') => {
  try {
    const result = await dbPool.request()
      .input('CurrencyCode', sql.VarChar(3), currency.toUpperCase())
      .query('SELECT ExchangeRate FROM Currencies WHERE CurrencyCode = @CurrencyCode');
    
    return result.recordset[0]?.ExchangeRate || 1.0; // Fallback to USD
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 1.0; // Fallback on error
  }
};

function dbReady(req) {
  return req.dbPool && req.dbPool.connected;
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
}

exports.createOrder = async (req, res) => {
  const {
    customer,
    currency = 'USD', // Changed default to USD for consistency
    items = [],
    discount_total = 0,
    tax_total = 0,
    shipping_total = 0,
    payment_method,
    meta: extraMeta = {},
  } = req.body || {};
  const exchangeRate = await getExchangeRate(req.dbPool, currency);

  try {
    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ error: 'missing_customer' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'no_items' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      const subtotal = items.reduce((s, it) => s + (Number(it.unit_price || 0) * Number(it.qty || 1)), 0);
      const toNum = (n) => Number(n || 0);
      const total = toNum(subtotal) - toNum(discount_total) + toNum(tax_total) + toNum(shipping_total);
      return res.json({
        ok: true,
        order_id: 1,
        order_number: 'FAKE-0001',
        total,
      });
    }

    const ids = items.map((it) => it.product_id).filter(Boolean);
    if (ids.length !== items.length) {
      return res.status(400).json({ error: 'missing_product_id' });
    }

    const inList = ids.map((_, i) => `@P${i}`).join(',');
    const prodReq = req.dbPool.request();
    ids.forEach((id, i) => prodReq.input(`P${i}`, sql.Int, id));
    const prodRes = await prodReq.query(`
      SELECT ProductId AS id, Name AS name, Price AS price, DiscountPrice AS discountprice,
             Stock AS stock, IsActive AS isactive
      FROM dbo.products
      WHERE ProductId IN (${inList})
    `);

    const dbProducts = prodRes.recordset || [];
    if (dbProducts.length !== ids.length) {
      return res.status(404).json({ error: 'some_products_not_found' });
    }
    const byId = new Map(dbProducts.map((p) => [String(p.id), p]));

    let subtotal = 0;
    const normalizedItems = [];

    for (const it of items) {
      const p = byId.get(String(it.product_id));
      if (!p) {
        return res.status(404).json({ error: 'product_not_found', product_id: it.product_id });
      }

      const inactive = (p.isactive === 0 || p.isactive === 'N' || p.isactive === false);
      if (inactive) {
        return res.status(400).json({ error: 'product_inactive', product_id: p.id });
      }

      const qty = Math.max(1, Number(it.qty || 1));
      if (Number.isFinite(p.stock) && p.stock < qty) {
        return res.status(409).json({ error: 'insufficient_stock', product_id: p.id });
      }

      const baseUnitPrice = Number(p.discountprice ?? p.price);
      if (!Number.isFinite(baseUnitPrice) || baseUnitPrice < 0) {
        return res.status(400).json({ error: 'invalid_price', product_id: p.id });
      }

      const unit_price = parseFloat(baseUnitPrice * exchangeRate).toFixed(2);
      const line_total = parseFloat(unit_price * qty).toFixed(2);
      subtotal += Number(line_total);

      normalizedItems.push({
        product_id: p.id,
        product_title: it.product_title || p.name,
        unit_price,
        qty,
        line_total,
        meta: it.meta ?? {},
      });
    }

    const toNum = (n) => Number(n || 0);
    const total = toNum(subtotal) - toNum(discount_total) + toNum(tax_total) + toNum(shipping_total);

    const tx = new sql.Transaction(req.dbPool);
    await tx.begin();

    try {
      const orderReq = new sql.Request(tx);
      orderReq
        .input('UserId', sql.Int, null) 
        .input('CustName', sql.NVarChar(255), String(customer.name))
        .input('CustEmail', sql.NVarChar(255), String(customer.email))
        .input('Status', sql.NVarChar(20), 'pending')
        .input('PayStatus', sql.NVarChar(20), 'pending')
        .input('Currency', sql.NVarChar(8), currency.toUpperCase())
        .input('Subtotal', sql.Decimal(18, 2), subtotal)
        .input('Discount', sql.Decimal(18, 2), discount_total || 0)
        .input('Tax', sql.Decimal(18, 2), tax_total || 0)
        .input('Shipping', sql.Decimal(18, 2), shipping_total || 0)
        .input('Total', sql.Decimal(18, 2), total)
        .input('Meta', sql.NVarChar(sql.MAX), JSON.stringify({
          phone: customer.phone,
          address: customer.address,
          payment_method,
          cart: items, 
          ...extraMeta,
        }))
        .input('PlacedAt', sql.DateTime2, new Date());

      const orderIns = await orderReq.query(`
        INSERT INTO dbo.orders
          (user_id, customer_name, customer_email, status, payment_status, currency,
           subtotal, discount_total, tax_total, shipping_total, total, meta, placed_at)
        OUTPUT INSERTED.id, INSERTED.order_number
        VALUES
          (@UserId, @CustName, @CustEmail, @Status, @PayStatus, @Currency,
           @Subtotal, @Discount, @Tax, @Shipping, @Total, @Meta, @PlacedAt)
      `);

      const orderRow = orderIns.recordset?.[0];
      if (!orderRow) throw new Error('order_insert_failed');

      const orderId = orderRow.id;

      for (const it of normalizedItems) {
        const itemReq = new sql.Request(tx);
        await itemReq
          .input('OrderId', sql.Int, orderId)
          .input('ProductId', sql.Int, it.product_id)
          .input('Title', sql.NVarChar(255), it.product_title)
          .input('UnitPrice', sql.Decimal(18, 2), it.unit_price)
          .input('Qty', sql.Int, it.qty)
          .input('LineTotal', sql.Decimal(18, 2), it.line_total)
          .input('Meta', sql.NVarChar(sql.MAX), JSON.stringify(it.meta || {}))
          .query(`
            INSERT INTO dbo.order_items
              (order_id, product_id, product_title, unit_price, qty, line_total, meta)
            VALUES
              (@OrderId, @ProductId, @Title, @UnitPrice, @Qty, @LineTotal, @Meta)
          `);
      }

      for (const it of normalizedItems) {
        const stockReq = new sql.Request(tx);
        const upd = await stockReq
          .input('ProductId', sql.Int, it.product_id)
          .input('Qty', sql.Int, it.qty)
          .query(`
            UPDATE dbo.products
            SET Stock = Stock - @Qty
            WHERE ProductId = @ProductId AND Stock >= @Qty
          `);
        if (upd.rowsAffected[0] === 0) {
          throw Object.assign(new Error('insufficient_stock'), { product_id: it.product_id });
        }
      }

      await tx.commit();

      return res.json({
        ok: true,
        order_id: orderId,
        order_number: orderRow.order_number || null,
        total,
        currency,
      });
    } catch (inner) {
      try { await tx.rollback(); } catch (_) {}
      if (inner?.message === 'insufficient_stock') {
        return res.status(409).json({ error: 'insufficient_stock', product_id: inner.product_id });
      }
      if (inner?.message === 'order_insert_failed') {
        return res.status(500).json({ error: 'order_insert_failed' });
      }
      console.error('createOrder (tx) error:', inner);
      return res.status(500).json({ error: 'internal_error' });
    }
  } catch (e) {
    console.error('checkout.createOrder error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};