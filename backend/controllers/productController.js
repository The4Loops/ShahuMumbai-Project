const sql = require('mssql');
const jwt = require('jsonwebtoken');

/* ---------------------------- color helpers ---------------------------- */
const asArrayOfStrings = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") return [val.trim()].filter(Boolean);
  return [];
};
const isValidColor = (s) =>
  /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(s) || /^[a-z][a-z0-9\s-]*$/i.test(s);
const sanitizeColors = (arr) => {
  const seen = new Set();
  return asArrayOfStrings(arr)
    .map((c) => c.toLowerCase())
    .filter((c) => isValidColor(c))
    .filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
};

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
      Colors,
    } = req.body;

    if (
      !Name ||
      !Description ||
      !ShortDescription ||
      !CategoryId ||
      !BrandDesigner ||
      !Price ||
      !Stock ||
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

    const cleanColors = sanitizeColors(Colors);

    const result = await req.dbPool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Description', sql.NVarChar, Description)
      .input('ShortDescription', sql.NVarChar, ShortDescription)
      .input('CategoryId', sql.Int, CategoryId)
      .input('BrandDesigner', sql.NVarChar, BrandDesigner)
      .input('Price', sql.Decimal(10, 2), parseFloat(Price))
      .input('DiscountPrice', sql.Decimal(10, 2), DiscountPrice ? parseFloat(DiscountPrice) : null)
      .input('Stock', sql.Int, parseInt(Stock))
      .input('IsActive', sql.Char(1), IsActive === true ? 'Y' : 'N')
      .input('IsFeatured', sql.Char(1), IsFeatured === true ? 'Y' : 'N')
      .input('UploadedDate', sql.DateTime, new Date(UploadedDate))
      .input('LaunchingDate', sql.DateTime, LaunchingDate ? new Date(LaunchingDate) : new Date())
      .input('CollectionId', sql.Int, CollectionId || null)
      .input('Colors', sql.NVarChar, JSON.stringify(cleanColors))
      .input('CreatedAt', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO products (
          Name, Description, ShortDescription, CategoryId, BrandDesigner, Price, DiscountPrice,
          Stock, IsActive, IsFeatured, UploadedDate, LaunchingDate, CollectionId, Colors,
          CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @Name, @Description, @ShortDescription, @CategoryId, @BrandDesigner, @Price, @DiscountPrice,
          @Stock, @IsActive, @IsFeatured, @UploadedDate, @LaunchingDate, @CollectionId, @Colors,
          @CreatedAt, @UpdatedAt
        )
      `);

    const product = result.recordset[0];
    if (!product) {
      return res.status(400).json({ message: 'Error inserting product' });
    }

    const imageRecords = images.map((img) => ({
      product_id: product.ProductId,
      image_url: img.url,
      is_hero: img.is_hero,
    }));

    const imageInsert = await req.dbPool.request();
    imageRecords.forEach((img) => {
      imageInsert.input('product_id', sql.Int, img.product_id);
      imageInsert.input('image_url', sql.NVarChar, img.image_url);
      imageInsert.input('is_hero', sql.Char(1), img.is_hero == true ? 'Y' : 'N');
    });
    const imageResult = await imageInsert.query(`
      INSERT INTO ProductImages (ProductId, ImageUrl, isHero)
      VALUES (@product_id, @image_url, @is_hero)
    `);
    if (imageResult.rowsAffected[0] !== images.length) {
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

    // Group images and categories per product
    const groupedProducts = result.recordset.reduce((acc, row) => {
      const productId = row.ProductId;
      if (!acc[productId]) {
        acc[productId] = {
          ...row,
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : [],
          colors: Array.isArray(JSON.parse(row.Colors || '[]')) ? JSON.parse(row.Colors) : [],
        };
        delete acc[productId].image_id;
        delete acc[productId].category_name;
      }
      if (row.image_url) {
        acc[productId].product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero =='Y' ? true : false,
        });
      }
      return acc;
    }, {});

    const normalized = Object.values(groupedProducts).map((p) => ({
      ...p,
      colors: Array.isArray(p.colors) ? p.colors : [],
    }));

    return res.status(200).json(normalized);
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

    if (!result.recordset.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Group images and categories
    const product = result.recordset.reduce((acc, row) => {
      if (!acc.ProductId) {
        acc = {
          ...row,
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : [],
          colors: Array.isArray(JSON.parse(row.Colors || '[]')) ? JSON.parse(row.Colors) : [],
        };
        delete acc.image_id;
        delete acc.category_name;
      }
      if (row.image_url) {
        acc.product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero == 'Y' ? true : false,
        });
      }
      return acc;
    }, {});

    const normalized = { ...product, colors: Array.isArray(product.colors) ? product.colors : [] };
    return res.status(200).json(normalized);
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
      Colors,
    } = req.body;

    // Validate required fields
    if (
      !Name ||
      !Description ||
      !ShortDescription ||
      !CategoryId ||
      !BrandDesigner ||
      !Price ||
      !Stock
    ) {
      return res.status(400).json({
        message: 'All required fields are required',
      });
    }

    const updateFields = {
      Name,
      Description,
      ShortDescription,
      CategoryId,
      BrandDesigner,
      Price: parseFloat(Price),
      DiscountPrice: DiscountPrice ? parseFloat(DiscountPrice) : null,
      Stock: parseInt(Stock),
      IsActive: IsActive === true || IsActive === 'true',
      IsFeatured: IsFeatured === true || IsFeatured === 'true',
      CollectionId: CollectionId || null,
      UpdatedAt: new Date(),
    };

    if (UploadedDate) {
      updateFields.UploadedDate = new Date(UploadedDate);
    }

    if (LaunchingDate) {
      updateFields.LaunchingDate = new Date(LaunchingDate);
    }

    if (typeof Colors !== 'undefined') {
      updateFields.Colors = JSON.stringify(sanitizeColors(Colors));
    }

    let query = 'UPDATE products SET UpdatedAt = @UpdatedAt';
    const request = req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .input('UpdatedAt', sql.DateTime, updateFields.UpdatedAt);

    if (updateFields.Name) {
      query += ', Name = @Name';
      request.input('Name', sql.NVarChar, updateFields.Name);
    }
    if (updateFields.Description) {
      query += ', Description = @Description';
      request.input('Description', sql.NVarChar, updateFields.Description);
    }
    if (updateFields.ShortDescription) {
      query += ', ShortDescription = @ShortDescription';
      request.input('ShortDescription', sql.NVarChar, updateFields.ShortDescription);
    }
    if (updateFields.CategoryId !== undefined) {
      query += ', CategoryId = @CategoryId';
      request.input('CategoryId', sql.Int, updateFields.CategoryId);
    }
    if (updateFields.BrandDesigner) {
      query += ', BrandDesigner = @BrandDesigner';
      request.input('BrandDesigner', sql.NVarChar, updateFields.BrandDesigner);
    }
    if (updateFields.Price !== undefined) {
      query += ', Price = @Price';
      request.input('Price', sql.Decimal(10, 2), updateFields.Price);
    }
    if (updateFields.DiscountPrice !== undefined) {
      query += ', DiscountPrice = @DiscountPrice';
      request.input('DiscountPrice', sql.Decimal(10, 2), updateFields.DiscountPrice);
    }
    if (updateFields.Stock !== undefined) {
      query += ', Stock = @Stock';
      request.input('Stock', sql.Int, updateFields.Stock);
    }
    if (updateFields.IsActive !== undefined) {
      query += ', IsActive = @IsActive';
      request.input('IsActive', sql.Char(1), updateFields.IsActive === true ? 'Y' : 'N');
    }
    if (updateFields.IsFeatured !== undefined) {
      query += ', IsFeatured = @IsFeatured';
      request.input('IsFeatured', sql.Char(1), updateFields.IsFeatured === true ? 'Y' : 'N');
    }
    if (updateFields.UploadedDate !== undefined) {
      query += ', UploadedDate = @UploadedDate';
      request.input('UploadedDate', sql.DateTime, updateFields.UploadedDate);
    }
    if (updateFields.LaunchingDate !== undefined) {
      query += ', LaunchingDate = @LaunchingDate';
      request.input('LaunchingDate', sql.DateTime, updateFields.LaunchingDate);
    }
    if (updateFields.CollectionId !== undefined) {
      query += ', CollectionId = @CollectionId';
      request.input('CollectionId', sql.Int, updateFields.CollectionId);
    }
    if (updateFields.Colors !== undefined) {
      query += ', Colors = @Colors';
      request.input('Colors', sql.NVarChar, updateFields.Colors);
    }

    query += ' OUTPUT INSERTED.* WHERE ProductId = @ProductId';

    const result = await request.query(query);

    const product = result.recordset[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (images && images.length > 0) {
      // Delete existing images
      await req.dbPool.request()
        .input('product_id', sql.Int, id)
        .query('DELETE FROM ProductImages WHERE ProductId = @product_id');

      // Insert new images
      const imageRequest = req.dbPool.request();
      images.forEach((img) => {
        imageRequest.input('product_id', sql.Int, id);
        imageRequest.input('image_url', sql.NVarChar, img.url);
        imageRequest.input('is_hero', sql.Char(1), img.is_hero == true ? 'Y' : 'N');
      });
      await imageRequest.query(`
        INSERT INTO ProductImages (ProductId, ImageUrl, isHero)
        VALUES (@product_id, @image_url, @is_hero)
      `);
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
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const { id } = req.params;

    const result = await req.dbPool.request()
      .input('ProductId', sql.Int, id)
      .query(`
        DELETE FROM products
        WHERE ProductId = @ProductId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('deleteProduct:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* ------------------------- Top Latest (Home) --------------------------- */
exports.getTopLatestProducts = async (req, res) => {
  try {
    const result = await req.dbPool.request()
      .query(`
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

    // Group images and categories per product
    const groupedProducts = result.recordset.reduce((acc, row) => {
      const productId = row.ProductId;
      if (!acc[productId]) {
        acc[productId] = {
          ...row,
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : [],
          colors: Array.isArray(JSON.parse(row.Colors || '[]')) ? JSON.parse(row.Colors) : [],
        };
        delete acc[productId].image_id;
        delete acc[productId].category_name;
      }
      if (row.image_url) {
        acc[productId].product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero,
        });
      }
      return acc;
    }, {});

    const normalized = Object.values(groupedProducts).map((p) => ({
      ...p,
      colors: Array.isArray(p.colors) ? p.colors : [],
    }));

    return res.status(200).json(normalized);
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

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const data = result.recordset[0];
    res.json(data);
  } catch (e) {
    console.error('setProductCollection:', e);
    res.status(500).json({ error: e.message });
  }
};

exports.getUpcomingProducts = async (req, res) => {
  try {
    const result = await req.dbPool.request()
      .query(`
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

    // Group images and categories per product
    const groupedProducts = result.recordset.reduce((acc, row) => {
      const productId = row.ProductId;
      if (!acc[productId]) {
        acc[productId] = {
          ...row,
          product_images: [],
          categories: row.category_name ? [{ CategoryId: row.CategoryId, Name: row.category_name }] : [],
          colors: Array.isArray(JSON.parse(row.Colors || '[]')) ? JSON.parse(row.Colors) : [],
        };
        delete acc[productId].image_id;
        delete acc[productId].category_name;
      }
      if (row.image_url) {
        acc[productId].product_images.push({
          id: row.image_id,
          image_url: row.image_url,
          is_hero: row.is_hero,
        });
      }
      return acc;
    }, {});

    const formattedProducts = Object.values(groupedProducts).map((p) => ({
      ...p,
      product_images: p.product_images || [],
      categories: p.categories || null,
      colors: Array.isArray(p.colors) ? p.colors : [],
    }));

    return res.status(200).json({
      message: 'Upcoming products retrieved successfully',
      products: formattedProducts,
    });
  } catch (error) {
    console.error('getUpcomingProducts:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};