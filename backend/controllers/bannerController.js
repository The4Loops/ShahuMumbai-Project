const sql = require('mssql');
const jwt = require("jsonwebtoken");

/* ------------------------- helpers ------------------------- */
const requireAdmin = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") return { error: "Forbidden: Admins only" };
    return { decoded };
  } catch {
    return { error: "Invalid token" };
  }
};

/* ------------------------- create -------------------------- */
exports.createBanner = async (req, res) => {
  const { error } = requireAdmin(req);
  if (error) return res.status(403).json({ message: error });

  try {
    const { title, description, image_url, is_active } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    const result = await req.db.request()
      .input('Title', sql.NVarChar, title.trim())
      .input('Description', sql.NVarChar, description ?? null)
      .input('ImageUrl', sql.NVarChar, image_url || null)
      .input('IsActive', sql.Char(1), is_active ==='true'?'Y':'N')
      .input('CreatedAt', sql.DateTime, new Date())
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO banners (Title, Description, ImageUrl, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@Title, @Description, @ImageUrl, @IsActive, @CreatedAt, @UpdatedAt)
      `);

    const banner = result.recordset[0];
    if (!banner) {
      return res.status(400).json({ message: 'Error inserting banner' });
    }

    return res.status(201).json({ message: 'Banner created successfully', banner });
  } catch (e) {
    console.error('createBanner:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};

/* --------------------------- read all --------------------------- */
exports.getAllBanners = async (req, res) => {
  try {
    const result = await req.db.request()
      .query(`
        SELECT BannerId, Title, Description, ImageUrl, IsActive, CreatedAt, UpdatedAt
        FROM banners
        ORDER BY UpdatedAt DESC
      `);

    const data = result.recordset;
    return res.status(200).json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('getAllBanners:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};

/* ------------------------- read one ------------------------- */
exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input('BannerId', sql.Int, id)
      .query(`
        SELECT BannerId, Title, Description, ImageUrl, IsActive, CreatedAt, UpdatedAt
        FROM banners
        WHERE BannerId = @BannerId
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error('getBannerById:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};

/* -------------------------- update -------------------------- */
exports.updateBanner = async (req, res) => {
  const { error } = requireAdmin(req);
  if (error) return res.status(403).json({ message: error });

  try {
    const { id } = req.params;
    const { title, description, image_url, is_active } = req.body;

    // Build patch object only with provided fields
    const patch = { UpdatedAt: new Date() };
    const params = { BannerId: id };
    let query = 'UPDATE banners SET UpdatedAt = @UpdatedAt';
    if (typeof title !== 'undefined') {
      patch.Title = String(title).trim();
      query += ', Title = @Title';
    }
    if (typeof description !== 'undefined') {
      patch.Description = description ?? null;
      query += ', Description = @Description';
    }
    if (typeof image_url !== 'undefined') {
      patch.ImageUrl = image_url || null;
      query += ', ImageUrl = @ImageUrl';
    }
    if (typeof is_active !== 'undefined') {
      patch.IsActive = is_active === 'true' ? 'Y' : 'N';
      query += ', IsActive = @IsActive';
    }
    query += ' OUTPUT INSERTED.* WHERE BannerId = @BannerId';

    const request = req.db.request()
      .input('BannerId', sql.Int, id)
      .input('UpdatedAt', sql.DateTime, patch.UpdatedAt);
    if (patch.Title) request.input('Title', sql.NVarChar, patch.Title);
    if (patch.Description !== undefined) request.input('Description', sql.NVarChar, patch.Description);
    if (patch.ImageUrl !== undefined) request.input('ImageUrl', sql.NVarChar, patch.ImageUrl);
    if (patch.IsActive !== undefined) request.input('IsActive', sql.Bit, patch.IsActive);

    const result = await request.query(query);

    const data = result.recordset[0];
    if (!data) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    return res.status(200).json({ message: 'Banner updated successfully', banner: data });
  } catch (e) {
    console.error('updateBanner:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};

/* -------------------------- delete -------------------------- */
exports.deleteBanner = async (req, res) => {
  const { error } = requireAdmin(req);
  if (error) return res.status(403).json({ message: error });

  try {
    const { id } = req.params;

    const result = await req.db.request()
      .input('BannerId', sql.Int, id)
      .query(`
        DELETE FROM banners
        OUTPUT DELETED.*
        WHERE BannerId = @BannerId
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    return res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (e) {
    console.error('deleteBanner:', e);
    return res.status(500).json({ message: 'Server error', error: e.message });
  }
};
