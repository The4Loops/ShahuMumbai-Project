// controllers/productsController.js
const sql = require('mssql');
const jwt = require('jsonwebtoken');

/* ------------------------------ Create -------------------------------- */
exports.createProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return res.status(403).json({ message: 'Forbidden: Admins only' });

    const {
      Name,
      Description,
      ShortDescription,
      CategoryId,
      BrandDesigner,
      Price,
      DiscountPrice,
      Stock,
      IsActive,
      IsFeatured,
      UploadedDate,
      LaunchingDate,
      images,
      CollectionId,
    } = req.body;

    if (
      !Name ||
      !Description ||
      !ShortDescription ||
      !CategoryId ||
      !BrandDesigner ||
      Price == null ||
      Stock == null ||
      !images ||
      images.length === 0
    ) {
      return res.status(400).json({
        message: 'All required fields and at least one image are required',
      });
    }
    if (!images.some((img) => img.is_hero)) {
      return res.status(400).json({ message: 'At least one image must be set as hero image' });
    }

    const result = await req.dbPool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Description', sql.NVarChar, Description)
      .input('ShortDescription', sql.NVarChar, ShortDescription)
      .input('CategoryId', sql.Int, CategoryId)
      .input('BrandDesigner', sql.NVarChar, BrandDesigner)
      .input('Price', sql.Decimal(10, 2), Number(Price))
      .input('DiscountPrice', sql.Decimal(10, 2), DiscountPrice != null ? Number(DiscountPrice) : null)
      .input('Stock', sql.Int, parseInt(Stock))
      .input('IsActive', sql.Char(1), IsActive === true ? 'Y' : 'N')
      .input('IsFeatured', sql.Char(1), IsFeatured === true ? 'Y' : 'N')
      .input('UploadedDate', sql.DateTime, UploadedDate ? new Date(UploadedDate) : new Date())
      .input('LaunchingDate', sql.DateTime, LaunchingDate ? new Date(LaunchingDate) : new Date())
      .input('CollectionId', sql.Int, CollectionId || null)
      .input('CreatedAt', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO products (
          Name, Description, ShortDescription, CategoryId, BrandDesigner, Price, DiscountPrice,
          Stock, IsActive, IsFeatured, UploadedDate, LaunchingDate, CollectionId,
          CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @Name, @Description, @ShortDescription, @CategoryId, @BrandDesigner, @Price, @DiscountPrice,
          @Stock, @IsActive, @IsFeatured, @UploadedDate, @LaunchingDate, @CollectionId,
          @CreatedAt, @UpdatedAt
        )
      `);

    const product = result.recordset[0];
    if (!product) return res.status(400).json({ message: 'Error inserting product' });

    // images
    let totalImagesInserted = 0;
    for (const img of images) {
      const r = await req.dbPool.request()
        .input('product_id', sql.Int, product.ProductId)
        .input('image_url', sql.NVarChar, img.url)
        .input('is_hero', sql.Char(1), img.is_hero === true ? 'Y' : 'N')
        .query(`INSERT INTO ProductImages (ProductId, ImageUrl, isHero) VALUES (@product_id, @image_url, @is_hero)`);
      if (r.rowsAffected[0] !== 1) return res.status(400).json({ message: 'Error inserting images' });
      totalImagesInserted++;
    }
    if (totalImagesInserted !== images.length) {
      return res.status(400).json({ message: 'Error inserting images' });
    }

    return res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('createProduct:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ------------------------------- Read All ------------------------------ */
exports.getAllProducts = async (req, res) => {
  try {
    // NOTE: currency ignored; we always return INR
    let query = `
      SELECT 
        p.*,
        pi.ProductImageid AS image_id,
        pi.ImageUrl AS image_url,
        pi.IsHero AS is_hero,
        c.CategoryId,
        c.Name AS category_name
      FROM products p
      LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
      LEFT JOIN categories c ON p.CategoryId = c.CategoryId
      WHERE p.IsActive = 'Y'
    `;
    const parameters = [];
    const { CategoryId, limit } = req.query;

    if (CategoryId) {
      query += ' AND c.Name LIKE @CategoryId';
      parameters.push({ name: 'CategoryId', type: sql.NVarChar, value: `%${CategoryId}%` });
    }
    if (limit) {
      query += ` ORDER BY p.UpdatedAt DESC OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
      parameters.push({ name: 'limit', type: sql.Int, value: parseInt(limit) });
    } else {
      query += ' ORDER BY p.UpdatedAt DESC';
    }

    const request = req.dbPool.request();
    parameters.forEach(param => request.input(param.name, param.type, param.value));
    const result = await request.query(query);

    const grouped = result.recordset.reduce((acc, row) => {
      const id = row.ProductId;
      if (!acc[id]) {
        acc[id] = {
          ...row,
          Price: Number(row.Price),
          DiscountPrice: row.DiscountPrice != null ? Number(row.DiscountPrice) : null,
          currency: 'INR',
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : [],
        };
        delete acc[id].image_id;
        delete acc[id].image_url;
        delete acc[id].is_hero;
        delete acc[id].category_name;
      }
      if (row.image_url) {
        acc[id].product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero === 'Y',
        });
      }
      return acc;
    }, {});

    return res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error('getAllProducts:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ------------------------------- Read One ------------------------------ */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .query(`
        SELECT 
          p.*,
          pi.ProductImageid AS image_id,
          pi.ImageUrl AS image_url,
          pi.isHero AS is_hero,
          c.CategoryId,
          c.Name AS category_name
        FROM products p
        LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
        LEFT JOIN categories c ON p.CategoryId = c.CategoryId
        WHERE p.ProductId = @ProductId
      `);

    if (!result.recordset.length) return res.status(404).json({ message: 'Product not found' });

    const product = result.recordset.reduce((acc, row) => {
      if (!acc.ProductId) {
        acc = {
          ...row,
          Price: Number(row.Price),
          DiscountPrice: row.DiscountPrice != null ? Number(row.DiscountPrice) : null,
          currency: 'INR',
          product_images: [],
          categories: [],
          colors: [],
        };
        delete acc.image_id;
        delete acc.image_url;
        delete acc.is_hero;
        delete acc.category_name;
        delete acc.Colors;
      }

      if (row.image_url && !acc.product_images.some(img => img.id === row.image_id)) {
        acc.product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero === 'Y',
        });
      }
      if (row.CategoryId && !acc.categories.some(cat => cat.CategoryId === row.CategoryId)) {
        acc.categories.push({ CategoryId: row.CategoryId, Name: row.category_name });
      }
      return acc;
    }, {});

    return res.status(200).json(product);
  } catch (error) {
    console.error('getProductById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ------------------------------ Update --------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return res.status(403).json({ message: 'Forbidden: Admins only' });

    const { id } = req.params;
    const {
      Name,
      Description,
      ShortDescription,
      CategoryId,
      BrandDesigner,
      Price,
      DiscountPrice,
      Stock,
      IsActive,
      IsFeatured,
      UploadedDate,
      LaunchingDate,
      images,
      CollectionId,
    } = req.body;

    if (
      !Name ||
      !Description ||
      !ShortDescription ||
      !CategoryId ||
      !BrandDesigner ||
      Price == null ||
      Stock == null
    ) {
      return res.status(400).json({ message: 'All required fields are required' });
    }

    const updateFields = {
      Name,
      Description,
      ShortDescription,
      CategoryId,
      BrandDesigner,
      Price: Number(Price),
      DiscountPrice: DiscountPrice != null ? Number(DiscountPrice) : null,
      Stock: parseInt(Stock),
      IsActive: IsActive === true || IsActive === 'true',
      IsFeatured: IsFeatured === true || IsFeatured === 'true',
      CollectionId: CollectionId || null,
      UpdatedAt: new Date(),
    };

    if (UploadedDate) updateFields.UploadedDate = new Date(UploadedDate);
    if (LaunchingDate) updateFields.LaunchingDate = new Date(LaunchingDate);

    let query = 'UPDATE products SET UpdatedAt = @UpdatedAt';
    const request = req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .input('UpdatedAt', sql.DateTime, updateFields.UpdatedAt);

    if (updateFields.Name) { query += ', Name = @Name'; request.input('Name', sql.NVarChar, updateFields.Name); }
    if (updateFields.Description) { query += ', Description = @Description'; request.input('Description', sql.NVarChar, updateFields.Description); }
    if (updateFields.ShortDescription) { query += ', ShortDescription = @ShortDescription'; request.input('ShortDescription', sql.NVarChar, updateFields.ShortDescription); }
    if (updateFields.CategoryId !== undefined) { query += ', CategoryId = @CategoryId'; request.input('CategoryId', sql.Int, updateFields.CategoryId); }
    if (updateFields.BrandDesigner) { query += ', BrandDesigner = @BrandDesigner'; request.input('BrandDesigner', sql.NVarChar, updateFields.BrandDesigner); }
    if (updateFields.Price !== undefined) { query += ', Price = @Price'; request.input('Price', sql.Decimal(10, 2), updateFields.Price); }
    if (updateFields.DiscountPrice !== undefined) { query += ', DiscountPrice = @DiscountPrice'; request.input('DiscountPrice', sql.Decimal(10, 2), updateFields.DiscountPrice); }
    if (updateFields.Stock !== undefined) { query += ', Stock = @Stock'; request.input('Stock', sql.Int, updateFields.Stock); }
    if (updateFields.IsActive !== undefined) { query += ', IsActive = @IsActive'; request.input('IsActive', sql.Char(1), updateFields.IsActive ? 'Y' : 'N'); }
    if (updateFields.IsFeatured !== undefined) { query += ', IsFeatured = @IsFeatured'; request.input('IsFeatured', sql.Char(1), updateFields.IsFeatured ? 'Y' : 'N'); }
    if (updateFields.UploadedDate !== undefined) { query += ', UploadedDate = @UploadedDate'; request.input('UploadedDate', sql.DateTime, updateFields.UploadedDate); }
    if (updateFields.LaunchingDate !== undefined) { query += ', LaunchingDate = @LaunchingDate'; request.input('LaunchingDate', sql.DateTime, updateFields.LaunchingDate); }
    if (updateFields.CollectionId !== undefined) { query += ', CollectionId = @CollectionId'; request.input('CollectionId', sql.Int, updateFields.CollectionId); }

    query += ' OUTPUT INSERTED.* WHERE ProductId = @ProductId';
    const result = await request.query(query);

    const product = result.recordset[0];
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (images && images.length > 0) {
      await req.dbPool.request().input('product_id', sql.Int, id).query('DELETE FROM ProductImages WHERE ProductId = @product_id');
      let totalImagesInserted = 0;
      for (const img of images) {
        const r = await req.dbPool.request()
          .input('product_id', sql.Int, id)
          .input('image_url', sql.NVarChar, img.url)
          .input('is_hero', sql.Char(1), img.is_hero === true ? 'Y' : 'N')
          .query(`INSERT INTO ProductImages (ProductId, ImageUrl, isHero) VALUES (@product_id, @image_url, @is_hero)`);
        if (r.rowsAffected[0] === 1) totalImagesInserted++;
      }
      if (totalImagesInserted !== images.length) return res.status(400).json({ message: 'Error inserting images' });
    }

    return res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('updateProduct:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ------------------------------ Delete --------------------------------- */
exports.deleteProduct = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return res.status(403).json({ message: 'Forbidden: Admins only' });

    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .query(`DELETE FROM products WHERE ProductId = @ProductId`);

    await req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .query(`DELETE FROM ProductImages WHERE ProductId = @ProductId`);

    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Product not found' });

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('deleteProduct:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ------------------------- Top Latest (Home) --------------------------- */
exports.getTopLatestProducts = async (req, res) => {
  try {
    const result = await req.dbPool.request().query(`
      SELECT 
        p.*,
        pi.ProductImageId AS image_id,
        pi.ImageUrl AS image_url,
        pi.IsHero AS is_hero,
        c.CategoryId,
        c.Name AS category_name
      FROM products p
      LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
      LEFT JOIN categories c ON p.CategoryId = c.CategoryId
      WHERE p.IsActive = 'Y'
      ORDER BY p.CreatedAt DESC
      OFFSET 0 ROWS FETCH NEXT 4 ROWS ONLY
    `);

    const grouped = result.recordset.reduce((acc, row) => {
      const id = row.ProductId;
      if (!acc[id]) {
        acc[id] = {
          ...row,
          Price: Number(row.Price),
          DiscountPrice: row.DiscountPrice != null ? Number(row.DiscountPrice) : null,
          currency: 'INR',
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : []
        };
        delete acc[id].image_id;
        delete acc[id].category_name;
        delete acc[id].image_url;
        delete acc[id].is_hero;
      }
      if (row.image_url) {
        acc[id].product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero === 'Y',
        });
      }
      return acc;
    }, {});
    return res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error('getTopLatestProducts:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* --------------------------- Set Collection --------------------------- */
exports.setProductCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { CollectionId } = req.body;

    const result = await req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .input('CollectionId', sql.Int, CollectionId || null)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE products
        SET CollectionId = @CollectionId, UpdatedAt = @UpdatedAt
        OUTPUT INSERTED.ProductId, INSERTED.CollectionId
        WHERE ProductId = @ProductId
      `);

    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Product not found' });

    res.json(result.recordset[0]);
  } catch (e) {
    console.error('setProductCollection:', e);
    res.status(500).json({ error: e.message });
  }
};

/* --------------------------- Upcoming (INR) ---------------------------- */
exports.getUpcomingProducts = async (req, res) => {
  try {
    const result = await req.dbPool.request().query(`
      SELECT 
        p.*,
        pi.ProductImageId AS image_id,
        pi.ImageUrl AS image_url,
        pi.IsHero AS is_hero,
        c.CategoryId,
        c.Name AS category_name
      FROM products p
      LEFT JOIN ProductImages pi ON p.ProductId = pi.ProductId
      LEFT JOIN categories c ON p.CategoryId = c.CategoryId
      WHERE p.IsActive = 'Y' AND p.LaunchingDate > GETDATE()
      ORDER BY p.LaunchingDate ASC
    `);

    const grouped = result.recordset.reduce((acc, row) => {
      const id = row.ProductId;
      if (!acc[id]) {
        acc[id] = {
          ...row,
          Price: Number(row.Price),
          DiscountPrice: row.DiscountPrice != null ? Number(row.DiscountPrice) : null,
          currency: 'INR',
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : []
        };
        delete acc[id].image_id;
        delete acc[id].category_name;
        delete acc[id].image_url;
        delete acc[id].is_hero;
      }
      if (row.image_url) {
        acc[id].product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero === 'Y',
        });
      }
      return acc;
    }, {});
    const products = Object.values(grouped);
    return res.status(200).json({ message: 'Upcoming products retrieved successfully', products });
  } catch (error) {
    console.error('getUpcomingProducts:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
