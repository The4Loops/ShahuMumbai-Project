const sql = require('mssql');
const currentCartOwner = require('../utils/currentCartOwner');

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

const now = () => new Date();
const toInt = (v) => (Number.isInteger(v) ? v : parseInt(v, 10));

function dbReady(req) {
  return req.dbPool && req.dbPool.connected;
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
}

// POST /api/cart    body: { product_id, quantity=1, mode='add' | 'set' }
exports.addToCart = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { product_id, quantity = 1, mode = 'add' } = req.body || {};

    // Basic validation
    if (product_id == null || Number.isNaN(Number(product_id))) {
      return res.status(400).json({ error: 'product_id is required' });
    }
    const qty = Number.isInteger(quantity) ? quantity : parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'quantity must be >= 1' });
    }

    // Loud logging for diagnosis
    console.log('[POST /api/cart] request', {
      owner,
      product_id,
      qty,
      mode,
      cookies: Object.keys(req.signedCookies || {}),
    });

    // Does a row already exist for this owner+product?
    const sel = await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .input('ProductId', sql.Int, Number(product_id))
      .query(`
        SELECT CartId AS Id, Quantity
        FROM dbo.carts
        WHERE UserId = @UserId AND ProductId = @ProductId
      `);

    const existing = sel.recordset?.[0];

    if (existing) {
      const newQty = mode === 'set' ? qty : (Number(existing.Quantity) + qty);

      const upd = await req.dbPool.request()
        .input('Id', sql.NVarChar(50), String(existing.Id))               // <— use the alias we selected
        .input('UserId', sql.NVarChar(128), String(owner))
        .input('Qty', sql.Int, newQty)
        .input('UpdatedAt', sql.DateTime2, new Date())
        .query(`
          UPDATE dbo.carts
          SET Quantity = @Qty, UpdatedAt = @UpdatedAt
          OUTPUT INSERTED.CartId   AS Id,
                 INSERTED.UserId   AS UserId,
                 INSERTED.ProductId AS ProductId,
                 INSERTED.Quantity AS Quantity,
                 INSERTED.CreatedAt AS CreatedAt,
                 INSERTED.UpdatedAt AS UpdatedAt
          WHERE CartId = @Id AND UserId = @UserId
        `);

      const row = upd.recordset?.[0];
      if (!row) {
        console.error('[POST /api/cart] failed_to_update_cart', { existing });
        return res.status(500).json({ error: 'failed_to_update_cart' });
      }
      return res.json(row);
    }

    // Insert new row
    const ins = await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .input('ProductId', sql.Int, Number(product_id))
      .input('Qty', sql.Int, qty)
      .input('CreatedAt', sql.DateTime2, new Date())
      .input('UpdatedAt', sql.DateTime2, new Date())
      .query(`
        INSERT INTO dbo.carts (UserId, ProductId, Quantity, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.CartId   AS Id,
               INSERTED.UserId   AS UserId,
               INSERTED.ProductId AS ProductId,
               INSERTED.Quantity AS Quantity,
               INSERTED.CreatedAt AS CreatedAt,
               INSERTED.UpdatedAt AS UpdatedAt
        VALUES (@UserId, @ProductId, @Qty, @CreatedAt, @UpdatedAt)
      `);

    const row = ins.recordset?.[0];
    return res.status(201).json(row);

  } catch (error) {
    // Print as much context as possible to your server console
    console.error('addToCart error:', {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state,
      stack: error.stack,
    });
    res.status(500).json({ error: 'internal_error' });
  }
};

// GET /api/cart
exports.getCartItems = async (req, res) => {
  try {
    if (!dbReady(req) && !devFakeAllowed()) {
      return res.status(500).json({ error: 'db_not_connected' });
    }
    const owner = currentCartOwner(req);
    const { currency = 'USD' } = req.query;
    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json([]);
    }

    const q = await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .query(`
        SELECT
          c.CartId AS id, c.UserId AS user_id, c.ProductId AS product_id, c.Quantity AS quantity,
          c.CreatedAt AS created_at, c.UpdatedAt AS updated_at,
          p.ProductId       AS prod_id,
          p.Name            AS prod_name,
          p.Price           AS prod_price,
          p.DiscountPrice   AS prod_discount,
          p.Stock           AS prod_stock,
          pi.ProductImageId AS img_id,
          pi.ImageUrl       AS img_url,
          pi.IsHero         AS img_is_hero, -- expects 'Y'/'N'
          cat.CategoryId    AS cat_id,
          cat.Name          AS cat_name
        FROM dbo.carts c
        INNER JOIN dbo.products p ON p.ProductId = c.ProductId
        LEFT JOIN dbo.ProductImages pi ON pi.ProductId = p.ProductId AND pi.IsHero = 'Y'
        LEFT JOIN dbo.Categories cat ON cat.CategoryId = p.CategoryId
        WHERE c.UserId = @UserId
        ORDER BY c.CreatedAt DESC
      `);

    const rows = q.recordset || [];
    const shaped = rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      product_id: r.product_id,
      quantity: r.quantity,
      created_at: r.created_at,
      updated_at: r.updated_at,
      product: {
        id: r.prod_id,
        name: r.prod_name,
        price: parseFloat(r.prod_price * exchangeRate).toFixed(2),
        discountprice: r.prod_discount ? parseFloat(r.prod_discount * exchangeRate).toFixed(2) : null,
        stock: r.prod_stock,
        currency,
        categories: r.cat_id ? [{ categoryid: r.cat_id, name: r.cat_name }] : [],
        product_images: r.img_id
          ? [{ id: r.img_id, image_url: r.img_url, is_hero: r.img_is_hero }]
          : [],
      },
    }));

    res.status(200).json(shaped);
  } catch (err) {
    console.error('getCartItems', err);
    res.status(500).json({ error: err.message || 'internal_error' });
  }
};

// GET /api/cartById (alias)
exports.getCartItemsByUserId = async (req, res) => exports.getCartItems(req, res);

// PUT /api/cart/:id  body: { quantity }
exports.updateCartItem = async (req, res) => {
  try {
    if (!dbReady(req) && !devFakeAllowed()) {
      return res.status(500).json({ error: 'db_not_connected' });
    }
    const owner = currentCartOwner(req);
    const { id } = req.params;
    const { quantity } = req.body || {};
    const qty = toInt(quantity);

    if (!id || !qty || qty < 1) {
      return res.status(400).json({ error: 'Invalid cart item ID or quantity' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({
        Id: id,
        UserId: String(owner),
        Quantity: qty,
        UpdatedAt: now(),
      });
    }

    const r = await req.dbPool.request()
      .input('Id', sql.NVarChar(50), id)
      .input('UserId', sql.NVarChar(128), String(owner))
      .input('Qty', sql.Int, qty)
      .input('UpdatedAt', sql.DateTime2, now())
      .query(`
        UPDATE dbo.carts
        SET Quantity = @Qty, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.CartId AS Id, INSERTED.UserId, INSERTED.ProductId, INSERTED.Quantity, INSERTED.CreatedAt, INSERTED.UpdatedAt
        WHERE CartId = @Id AND UserId = @UserId
      `);

    const row = r.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'Cart item not found' });

    res.status(200).json(row);
  } catch (err) {
    console.error('updateCartItem', err);
    res.status(500).json({ error: err.message || 'internal_error' });
  }
};

// DELETE /api/cart/:id
exports.deleteCartItem = async (req, res) => {
  try {
    if (!dbReady(req) && !devFakeAllowed()) {
      return res.status(500).json({ error: 'db_not_connected' });
    }
    const owner = currentCartOwner(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Cart item ID is required' });

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Cart item deleted successfully' });
    }

    const r = await req.dbPool.request()
      .input('Id', sql.NVarChar(50), id)
      .input('UserId', sql.NVarChar(128), String(owner))
      .query(`
        DELETE FROM dbo.carts
        OUTPUT DELETED.CartId AS Id
        WHERE CartId = @Id AND UserId = @UserId
      `);

    if (!r.recordset?.length) return res.status(404).json({ error: 'Cart item not found' });

    res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (err) {
    console.error('deleteCartItem', err);
    res.status(500).json({ error: err.message || 'internal_error' });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    if (!dbReady(req) && !devFakeAllowed()) {
      return res.status(500).json({ error: 'db_not_connected' });
    }
    const owner = currentCartOwner(req);

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Cart cleared successfully' });
    }

    await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .query(`
        DELETE FROM dbo.carts
        WHERE UserId = @UserId
      `);

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('clearCart', err);
    res.status(500).json({ error: err.message || 'internal_error' });
  }
};