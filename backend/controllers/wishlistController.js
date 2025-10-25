const jwt = require('jsonwebtoken');
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

// Verify User
const verifyUser = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { error: 'Unauthorized: Token missing' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { decoded };
  } catch (err) {
    return { error: 'Invalid Token' };
  }
};

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const productResult = await req.dbPool.request()
      .input('ProductId', sql.Int, product_id)
      .query('SELECT ProductId FROM products WHERE ProductId = @ProductId');
    if (!productResult.recordset[0]) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item is already in wishlist
    const existingItemResult = await req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .input('ProductId', sql.Int, product_id)
      .query('SELECT WishListId FROM wishlist WHERE UserId = @UserId AND ProductId = @ProductId');
    if (existingItemResult.recordset[0]) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    // Add to wishlist
    const insertResult = await req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .input('ProductId', sql.Int, product_id)
      .query(`
        INSERT INTO wishlist (UserId, ProductId, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.WishListId, INSERTED.UserId, INSERTED.ProductId, INSERTED.CreatedAt, INSERTED.UpdatedAt
        VALUES (@UserId, @ProductId, GETDATE(), GETDATE())
      `);
    const data = insertResult.recordset[0];

    res.status(201).json({ message: 'Item added to wishlist', data });
  } catch (err) {
    console.error('Error in addToWishlist:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { currency = 'USD' } = req.query;
    const exchangeRate = await getExchangeRate(req.dbPool, currency);

    const result = await req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .query(`
        SELECT 
          w.WishListId AS id,
          w.UserId AS user_id,
          w.ProductId AS product_id,
          w.CreatedAt AS created_at,
          w.UpdatedAt AS updated_at,
          p.Name AS name,
          p.Price AS price,
          p.DiscountPrice AS discountprice,
          p.Stock AS stock,
          pi.ImageUrl AS image_url,
          c.CategoryId AS categoryid,
          c.Name AS category_name
        FROM wishlist w
        INNER JOIN products p ON w.ProductId = p.ProductId
        LEFT JOIN ProductImages pi ON p.ProductId = pi.productId AND pi.IsHero = 'Y'
        LEFT JOIN categories c ON p.CategoryId = c.CategoryId
        WHERE w.UserId = @UserId
      `);

    const processedData = result.recordset.reduce((acc, item) => {
      const existingItem = acc.find(x => x.id === item.id);
      if (existingItem) {
        // Add category only if it's new and not already in array
        if (
          item.categoryid &&
          !existingItem.products.categories.some(c => c.categoryid === item.categoryid)
        ) {
          existingItem.products.categories.push({
            categoryid: item.categoryid,
            name: item.category_name
          });
        }
      } else {
        acc.push({
          id: item.id,
          user_id: item.user_id,
          product_id: item.product_id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          products: {
            id: item.product_id,
            name: item.name,
            price: parseFloat((Number(item.price) * exchangeRate).toFixed(2)),
            discountprice: item.discountprice ? parseFloat((Number(item.discountprice) * exchangeRate).toFixed(2)) : null,
            stock: item.stock,
            image_url: item.image_url || null,
            currency,
            categories: item.categoryid
              ? [
                  {
                    categoryid: item.categoryid,
                    name: item.category_name
                  }
                ]
              : []
          }
        });
      }
      return acc;
    }, []);

    res.status(200).json({ message: 'Wishlist retrieved', data: processedData, currency });
  } catch (err) {
    console.error('Error in getWishlist:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('WishListId', sql.Int, id)
      .input('UserId', sql.Int, decoded.id)
      .query(`
        DELETE FROM wishlist
        OUTPUT DELETED.WishListId AS id, DELETED.UserId AS user_id, DELETED.ProductId AS product_id, DELETED.CreatedAt AS created_at, DELETED.UpdatedAt AS updated_at
        WHERE WishListId = @WishListId AND UserId = @UserId
      `);
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    const data = result.recordset[0];
    res.status(200).json({ message: 'Item removed from wishlist', data });
  } catch (err) {
    console.error('Error in removeFromWishlist:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  const { error, decoded } = verifyUser(req);
  if (error) return res.status(401).json({ error });

  try {
    const result = await req.dbPool.request()
      .input('UserId', sql.Int, decoded.id)
      .query(`
        DELETE FROM wishlist
        OUTPUT DELETED.WishListId AS id, DELETED.UserId AS user_id, DELETED.ProductId AS product_id, DELETED.CreatedAt AS created_at, DELETED.UpdatedAt AS updated_at
        WHERE UserId = @UserId
      `);

    const data = result.recordset;
    res.status(200).json({ message: 'Wishlist cleared', data });
  } catch (err) {
    console.error('Error in clearWishlist:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};