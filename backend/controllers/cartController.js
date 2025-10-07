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
        SELECT CartId, quantity
        FROM dbo.carts
        WHERE UserId = @UserId AND ProductId = @ProductId
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
          OUTPUT INSERTED.CartId, INSERTED.UserId, INSERTED.ProductId, INSERTED.quantity, INSERTED.CreatedAt, INSERTED.UpdatedAt
          WHERE CartId = @Id AND UserId = @UserId
        `);

      const row = upd.recordset?.[0];
      return res.json(row);
    } else {
      const ins = await req.dbPool.request()
        .input('UserId', sql.NVarChar(128), String(owner))
        .input('ProductId', sql.Int, product_id)
        .input('Qty', sql.Int, qty)
        .input('CreatedAt', sql.DateTime2, now())
        .input('UpdatedAt', sql.DateTime2, now())
        .query(`
          INSERT INTO dbo.carts (UserId, ProductId, quantity, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.CartId, INSERTED.UserId, INSERTED.ProductId, INSERTED.quantity, INSERTED.CreatedAt, INSERTED.UpdatedAt
          VALUES (@UserId, @ProductId, @Qty, @CreatedAt, @UpdatedAt)
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
          c.CartId AS id, c.UserId AS user_id, c.ProductId AS product_id, c.Quantity AS quantity, c.CreatedAt AS created_at, c.UpdatedAt updated_at,
          p.ProductId       AS prod_id,
          p.Name            AS prod_name,
          p.Price           AS prod_price,
          p.DiscountPrice   AS prod_discount,
          p.Stock           AS prod_stock,
          pi.ProductImageId             AS img_id,
          pi.ImageUrl      AS img_url,
          pi.isHero        AS img_is_hero,
          c2.CategoryId     AS cat_id,
          c2.Name           AS cat_name
        FROM dbo.carts c
        INNER JOIN dbo.products p ON p.ProductId = c.ProductId
        LEFT JOIN dbo.ProductImages pi ON pi.ProductId = p.ProductId AND pi.IsHero ='Y'
        LEFT JOIN dbo.Categories c2 ON c2.CategoryId = p.CategoryId
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
      .input('CartId', sql.NVarChar(50), id)
      .input('UserId', sql.NVarChar(128), String(owner))
      .input('Quantity', sql.Int, qty)
      .input('UpdatedAt', sql.DateTime2, now())
      .query(`
        UPDATE dbo.carts
        SET quantity = @Qty, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.CartId, INSERTED.UserId, INSERTED.ProductId, INSERTED.quantity, INSERTED.CreatedAt, INSERTED.UpdatedAt
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
    const owner = currentCartOwner(req);
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Cart item ID is required' });

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Cart item deleted successfully' });
    }

    const r = await req.dbPool.request()
      .input('Id', sql.Int, id)
      .input('UserId', sql.Int, parseInt(owner))
      .query(`
        DELETE FROM dbo.carts
        OUTPUT DELETED.id
        WHERE Cartid = @Id AND UserId = @UserId
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
