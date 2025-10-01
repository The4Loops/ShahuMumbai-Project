const sql = require('mssql');
const crypto = require('crypto');
const currentCartOwner = require('../utils/currentCartOwner');

const now = () => new Date();
const toInt = (v) => (Number.isInteger(v) ? v : parseInt(v, 10));

function dbReady(req) {
  return req.dbPool && req.dbPool.connected;
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
}

// POST /api/cart    { product_id, quantity=1, mode='add' | 'set' }
exports.addToCart = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { product_id, quantity = 1, mode = 'add' } = req.body || {};

    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    const qty = toInt(quantity);
    if (!qty || qty < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

   
    if (!dbReady(req) && devFakeAllowed()) {
      const id = crypto.randomUUID();
      return res.status(201).json({
        id,
        user_id: owner,
        product_id,
        quantity: qty,
        created_at: now(),
        updated_at: now(),
      });
    }

    
    const sel = await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .input('ProductId', sql.Int, product_id)
      .query(`
        SELECT id, quantity
        FROM dbo.carts
        WHERE user_id = @UserId AND product_id = @ProductId
      `);

    const existing = sel.recordset?.[0];

    if (existing) {
      const newQty = mode === 'set' ? qty : (Number(existing.quantity) + qty);
      const upd = await req.dbPool.request()
        .input('Id', sql.NVarChar(50), existing.id)
        .input('UserId', sql.NVarChar(128), String(owner))
        .input('Qty', sql.Int, newQty)
        .input('UpdatedAt', sql.DateTime2, now())
        .query(`
          UPDATE dbo.carts
          SET quantity = @Qty, updated_at = @UpdatedAt
          OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.product_id, INSERTED.quantity, INSERTED.created_at, INSERTED.updated_at
          WHERE id = @Id AND user_id = @UserId
        `);

      const row = upd.recordset?.[0];
      return res.json(row);
    } else {
      const id = crypto.randomUUID();
      const ins = await req.dbPool.request()
        .input('Id', sql.NVarChar(50), id)
        .input('UserId', sql.NVarChar(128), String(owner))
        .input('ProductId', sql.Int, product_id)
        .input('Qty', sql.Int, qty)
        .input('CreatedAt', sql.DateTime2, now())
        .input('UpdatedAt', sql.DateTime2, now())
        .query(`
          INSERT INTO dbo.carts (id, user_id, product_id, quantity, created_at, updated_at)
          OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.product_id, INSERTED.quantity, INSERTED.created_at, INSERTED.updated_at
          VALUES (@Id, @UserId, @ProductId, @Qty, @CreatedAt, @UpdatedAt)
        `);

      const row = ins.recordset?.[0];
      return res.status(201).json(row);
    }
  } catch (error) {
    console.error('addToCart', error);
    res.status(500).json({ error: error.message || 'internal_error' });
  }
};

// GET /api/cart
exports.getCartItems = async (req, res) => {
  try {
    const owner = currentCartOwner(req);

    // Dev fallback
    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json([
        {
          id: crypto.randomUUID(),
          user_id: owner,
          product_id: 1,
          quantity: 2,
          created_at: now(),
          updated_at: now(),
          product: {
            id: 1,
            name: 'Sample Product',
            price: 999,
            discountprice: 899,
            stock: 5,
            categories: [{ categoryid: 10, name: 'Category' }],
            product_images: [{ id: 1, image_url: null, is_hero: 1 }],
          },
        },
      ]);
    }

    const q = await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .query(`
        SELECT
          c.id, c.user_id, c.product_id, c.quantity, c.created_at, c.updated_at,
          p.ProductId       AS prod_id,
          p.Name            AS prod_name,
          p.Price           AS prod_price,
          p.DiscountPrice   AS prod_discount,
          p.Stock           AS prod_stock,
          pi.id             AS img_id,
          pi.image_url      AS img_url,
          pi.is_hero        AS img_is_hero,
          c2.CategoryId     AS cat_id,
          c2.Name           AS cat_name
        FROM dbo.carts c
        INNER JOIN dbo.products p ON p.ProductId = c.product_id
        LEFT JOIN dbo.product_images pi ON pi.product_id = p.ProductId AND pi.is_hero = 1
        LEFT JOIN dbo.categories c2 ON c2.CategoryId = p.CategoryId
        WHERE c.user_id = @UserId
        ORDER BY c.created_at DESC
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
        price: r.prod_price,
        discountprice: r.prod_discount,
        stock: r.prod_stock,
        categories: r.cat_id ? [{ categoryid: r.cat_id, name: r.cat_name }] : [],
        product_images: r.img_id ? [{ id: r.img_id, image_url: r.img_url, is_hero: r.img_is_hero }] : [],
      },
    }));

    res.status(200).json(shaped);
  } catch (err) {
    console.error('getCartItems', err);
    res.status(500).json({ error: err.message || 'internal_error' });
  }
};

// GET /api/cartById   (same behavior)
exports.getCartItemsByUserId = async (req, res) => {
  // just re-use above
  return exports.getCartItems(req, res);
};

// PUT /api/cart/:id  { quantity }
exports.updateCartItem = async (req, res) => {
  try {
    const owner = currentCartOwner(req);
    const { id } = req.params;
    const { quantity } = req.body || {};
    const qty = toInt(quantity);

    if (!id || !qty || qty < 1) {
      return res.status(400).json({ error: 'Invalid cart item ID or quantity' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({
        id,
        user_id: owner,
        product_id: 1,
        quantity: qty,
        created_at: now(),
        updated_at: now(),
      });
    }

    const r = await req.dbPool.request()
      .input('Id', sql.NVarChar(50), id)
      .input('UserId', sql.NVarChar(128), String(owner))
      .input('Qty', sql.Int, qty)
      .input('UpdatedAt', sql.DateTime2, now())
      .query(`
        UPDATE dbo.carts
        SET quantity = @Qty, updated_at = @UpdatedAt
        OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.product_id, INSERTED.quantity, INSERTED.created_at, INSERTED.updated_at
        WHERE id = @Id AND user_id = @UserId
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
        OUTPUT DELETED.id
        WHERE id = @Id AND user_id = @UserId
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
    const owner = currentCartOwner(req);

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Cart cleared successfully' });
    }

    await req.dbPool.request()
      .input('UserId', sql.NVarChar(128), String(owner))
      .query(`
        DELETE FROM dbo.carts
        WHERE user_id = @UserId
      `);

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('clearCart', err);
    res.status(500).json({ error: err.message || 'internal_error' });
  }
};
