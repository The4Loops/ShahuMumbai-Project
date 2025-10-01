const sql = require('mssql');

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const now = () => new Date();
const dbReady = (req) => req.dbPool && req.dbPool.connected;
const devFakeAllowed = () => process.env.ALLOW_FAKE === '1';

function parseBoolStr(v) {
  if (v === undefined || v === '') return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'y' || s === 'yes';
}

/* GET /api/collections
   Query params: q, status, is_active, limit, offset
   Returns: { collections: [...], total: number } */
exports.listCollections = async (req, res) => {
  try {
    const {
      q = '',
      status,
      is_active,
      limit: limitStr = '50',
      offset: offsetStr = '0',
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    if (!dbReady(req) && devFakeAllowed()) {
      const fake = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Festive Edit',
          slug: 'festive-edit',
          description: 'Handpicked looks',
          cover_image: null,
          status: 'PUBLISHED',
          is_active: true,
          created_at: now(),
          updated_at: now(),
          product_count: 3,
          categoryids: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
        },
      ];
      return res.json({ collections: fake, total: fake.length });
    }

    const clauses = [];
    const reqst = req.dbPool.request();

    if (q) {
      reqst.input('Q', sql.NVarChar(400), `%${q}%`);
      clauses.push('(Title LIKE @Q OR Slug LIKE @Q OR Description LIKE @Q)');
    }
    if (status) {
      reqst.input('Status', sql.NVarChar(30), String(status).toUpperCase());
      clauses.push('Status = @Status');
    }
    if (is_active !== undefined && is_active !== '') {
      const b = parseBoolStr(is_active) ? 1 : 0;
      reqst.input('IsActive', sql.Bit, b);
      clauses.push('IsActive = @IsActive');
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const countRes = await reqst.query(`
      SELECT COUNT(*) AS total
      FROM dbo.collections
      ${whereSql}
    `);
    const total = countRes.recordset?.[0]?.total || 0;

    const pageReq = req.dbPool.request();
    if (q) pageReq.input('Q', sql.NVarChar(400), `%${q}%`);
    if (status) pageReq.input('Status', sql.NVarChar(30), String(status).toUpperCase());
    if (is_active !== undefined && is_active !== '') {
      pageReq.input('IsActive', sql.Bit, parseBoolStr(is_active) ? 1 : 0);
    }
    pageReq.input('Limit', sql.Int, limit);
    pageReq.input('Offset', sql.Int, offset);

    const pageRes = await pageReq.query(`
      SELECT
        c.Id           AS id,
        c.Title        AS title,
        c.Slug         AS slug,
        c.Description  AS description,
        c.CoverImage   AS cover_image,
        c.Status       AS status,
        c.IsActive     AS is_active,
        c.CreatedAt    AS created_at,
        c.UpdatedAt    AS updated_at,
        ISNULL(pc.ProductsCount, 0) AS product_count
      FROM dbo.collections c
      OUTER APPLY (
        SELECT COUNT(*) AS ProductsCount
        FROM dbo.products p
        WHERE p.CollectionId = c.Id
      ) pc
      ${whereSql}
      ORDER BY c.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

    const rows = pageRes.recordset || [];
    if (!rows.length) return res.json({ collections: [], total });

    const ids = rows.map(r => r.id);
    const inList = ids.map((_, i) => `@C${i}`).join(',');
    const catReq = req.dbPool.request();
    ids.forEach((val, i) => catReq.input(`C${i}`, sql.UniqueIdentifier, val));

    const catsRes = await catReq.query(`
      SELECT collection_id, category_id
      FROM dbo.collection_categories
      WHERE collection_id IN (${inList})
    `);
    const cats = catsRes.recordset || [];
    const byCollection = cats.reduce((acc, r) => {
      (acc[r.collection_id] ||= []).push(r.category_id);
      return acc;
    }, {});

    const formatted = rows.map(r => ({
      ...r,
      is_active: r.is_active === true || r.is_active === 1,
      categoryids: byCollection[r.id] || [],
    }));

    return res.json({ collections: formatted, total });
  } catch (e) {
    console.error('collections.listCollections error', e);
    return res.status(500).json({ error: 'Internal server error', details: e.message });
  }
};

/* GET /api/collections/:id*/
exports.getCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!uuidRe.test(id)) {
      return res.status(400).json({ error: 'Invalid collection id format' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.json({
        id,
        title: 'Festive Edit',
        slug: 'festive-edit',
        description: 'Handpicked looks',
        cover_image: null,
        status: 'PUBLISHED',
        is_active: true,
        created_at: now(),
        updated_at: now(),
        categoryids: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
      });
    }

    const r = await req.dbPool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query(`
        SELECT
          Id          AS id,
          Title       AS title,
          Slug        AS slug,
          Description AS description,
          CoverImage  AS cover_image,
          Status      AS status,
          IsActive    AS is_active,
          CreatedAt   AS created_at,
          UpdatedAt   AS updated_at
        FROM dbo.collections
        WHERE Id = @Id
      `);

    const data = r.recordset?.[0];
    if (!data) return res.status(404).json({ error: 'Collection not found' });

    const map = await req.dbPool.request()
      .input('Id', sql.UniqueIdentifier, id)
      .query(`
        SELECT category_id
        FROM dbo.collection_categories
        WHERE collection_id = @Id
      `);

    const categoryids = (map.recordset || []).map(x => x.category_id);
    return res.json({
      ...data,
      is_active: data.is_active === true || data.is_active === 1,
      categoryids,
    });
  } catch (e) {
    console.error('collections.getCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* POST /api/collections
   Body: { title, slug, description, cover_image, status, is_active, categoryids[] }
   Returns: { message, collection }*/
exports.createCollection = async (req, res) => {
  try {
    const { title, slug, description, cover_image, status, is_active, categoryids } = req.body || {};

    if (!title || !slug || !status || !Array.isArray(categoryids) || categoryids.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid required fields: title, slug, status, categoryids (must be a non-empty array)' });
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }
    for (const cid of categoryids) {
      if (!uuidRe.test(cid)) {
        return res.status(400).json({ error: `Invalid category ID format: ${cid}` });
      }
    }

    if (!dbReady(req) && devFakeAllowed()) {
      const fake = {
        id: '22222222-2222-2222-2222-222222222222',
        title,
        slug: String(slug).trim().toLowerCase(),
        description: description ?? null,
        cover_image: cover_image ?? null,
        status: String(status).toUpperCase(),
        is_active: !!is_active,
        created_at: now(),
        updated_at: now(),
        categoryids: [...categoryids],
      };
      return res.status(201).json({ message: 'Collection created successfully', collection: fake });
    }

    const tx = new sql.Transaction(req.dbPool);
    await tx.begin();
    try {
      const id = crypto.randomUUID();

      const insertReq = new sql.Request(tx);
      insertReq
        .input('Id', sql.UniqueIdentifier, id)
        .input('Title', sql.NVarChar(255), String(title))
        .input('Slug', sql.NVarChar(255), String(slug).trim().toLowerCase())
        .input('Description', sql.NVarChar(sql.MAX), description ?? null)
        .input('Cover', sql.NVarChar(1024), cover_image ?? null)
        .input('Status', sql.NVarChar(30), String(status).toUpperCase())
        .input('Active', sql.Bit, !!is_active ? 1 : 0)
        .input('CreatedAt', sql.DateTime2, now())
        .input('UpdatedAt', sql.DateTime2, now());

      const ins = await insertReq.query(`
        INSERT INTO dbo.collections
          (Id, Title, Slug, Description, CoverImage, Status, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES
          (@Id, @Title, @Slug, @Description, @Cover, @Status, @Active, @CreatedAt, @UpdatedAt)
      `);
      const coll = ins.recordset?.[0];

      for (const cid of categoryids) {
        const j = new sql.Request(tx);
        await j
          .input('Coll', sql.UniqueIdentifier, id)
          .input('Cat', sql.UniqueIdentifier, cid)
          .query(`
            INSERT INTO dbo.collection_categories (collection_id, category_id)
            VALUES (@Coll, @Cat)
          `);
      }

      await tx.commit();

      return res.status(201).json({
        message: 'Collection created successfully',
        collection: {
          id: coll.Id,
          title: coll.Title,
          slug: coll.Slug,
          description: coll.Description,
          cover_image: coll.CoverImage,
          status: coll.Status,
          is_active: coll.IsActive === true || coll.IsActive === 1,
          created_at: coll.CreatedAt,
          updated_at: coll.UpdatedAt,
          categoryids: [...categoryids],
        },
      });
    } catch (inner) {
      try { await tx.rollback(); } catch {}
      const num = inner?.originalError?.info?.number;
      if (num === 2601 || num === 2627) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      if (num === 547) { 
        return res.status(400).json({ error: 'One or more category IDs do not exist' });
      }
      console.error('collections.createCollection tx error', inner);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (e) {
    console.error('collections.createCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* PUT /api/collections/:id*/
exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!uuidRe.test(id)) {
      return res.status(400).json({ error: 'Invalid collection id format' });
    }

    const { title, slug, description, cover_image, status, is_active, categoryids } = req.body || {};

    const updates = {};
    if (title !== undefined) updates.Title = title;
    if (slug !== undefined) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slug || !slugRegex.test(slug)) {
        return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      }
      updates.Slug = String(slug).trim().toLowerCase();
    }
    if (description !== undefined) updates.Description = description;
    if (cover_image !== undefined) updates.CoverImage = cover_image;
    if (status !== undefined) updates.Status = String(status).toUpperCase();
    if (is_active !== undefined) updates.IsActive = !!is_active;

    if (categoryids !== undefined) {
      if (!Array.isArray(categoryids) || categoryids.length === 0) {
        return res.status(400).json({ error: 'categoryids must be a non-empty array' });
      }
      for (const cid of categoryids) {
        if (!uuidRe.test(cid)) {
          return res.status(400).json({ error: `Invalid category ID format: ${cid}` });
        }
      }
    }

    if (!Object.keys(updates).length && categoryids === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({
        message: 'Collection updated successfully',
        collection: {
          id,
          title: updates.Title ?? 'Sample',
          slug: updates.Slug ?? 'sample',
          description: updates.Description ?? null,
          cover_image: updates.CoverImage ?? null,
          status: updates.Status ?? 'DRAFT',
          is_active: updates.IsActive ?? true,
          created_at: now(),
          updated_at: now(),
          categoryids: categoryids ?? ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
        },
      });
    }

    const tx = new sql.Transaction(req.dbPool);
    await tx.begin();
    try {
      let updatedRow = null;
      if (Object.keys(updates).length) {
        const sets = ['UpdatedAt = @UpdatedAt'];
        const reqst = new sql.Request(tx)
          .input('Id', sql.UniqueIdentifier, id)
          .input('UpdatedAt', sql.DateTime2, now());

        if ('Title' in updates) { sets.push('Title=@Title'); reqst.input('Title', sql.NVarChar(255), updates.Title); }
        if ('Slug' in updates)  { sets.push('Slug=@Slug');   reqst.input('Slug', sql.NVarChar(255), updates.Slug); }
        if ('Description' in updates) { sets.push('Description=@Description'); reqst.input('Description', sql.NVarChar(sql.MAX), updates.Description ?? null); }
        if ('CoverImage' in updates)  { sets.push('CoverImage=@CoverImage'); reqst.input('CoverImage', sql.NVarChar(1024), updates.CoverImage ?? null); }
        if ('Status' in updates)      { sets.push('Status=@Status'); reqst.input('Status', sql.NVarChar(30), updates.Status); }
        if ('IsActive' in updates)    { sets.push('IsActive=@IsActive'); reqst.input('IsActive', sql.Bit, updates.IsActive ? 1 : 0); }

        const up = await reqst.query(`
          UPDATE dbo.collections
          SET ${sets.join(', ')}
          OUTPUT INSERTED.*
          WHERE Id = @Id
        `);
        updatedRow = up.recordset?.[0];
        if (!updatedRow) {
          await tx.rollback();
          return res.status(404).json({ error: 'Collection not found' });
        }
      } else {
        const cur = await new sql.Request(tx)
          .input('Id', sql.UniqueIdentifier, id)
          .query(`SELECT * FROM dbo.collections WHERE Id=@Id`);
        updatedRow = cur.recordset?.[0];
        if (!updatedRow) {
          await tx.rollback();
          return res.status(404).json({ error: 'Collection not found' });
        }
      }

      if (categoryids !== undefined) {
        await new sql.Request(tx)
          .input('Id', sql.UniqueIdentifier, id)
          .query(`DELETE FROM dbo.collection_categories WHERE collection_id=@Id`);

        for (const cid of categoryids) {
          await new sql.Request(tx)
            .input('Coll', sql.UniqueIdentifier, id)
            .input('Cat', sql.UniqueIdentifier, cid)
            .query(`
              INSERT INTO dbo.collection_categories (collection_id, category_id)
              VALUES (@Coll, @Cat)
            `);
        }
      }

      const cats = await new sql.Request(tx)
        .input('Id', sql.UniqueIdentifier, id)
        .query(`
          SELECT category_id
          FROM dbo.collection_categories
          WHERE collection_id=@Id
        `);

      await tx.commit();

      return res.status(200).json({
        message: 'Collection updated successfully',
        collection: {
          id: updatedRow.Id,
          title: updatedRow.Title,
          slug: updatedRow.Slug,
          description: updatedRow.Description,
          cover_image: updatedRow.CoverImage,
          status: updatedRow.Status,
          is_active: updatedRow.IsActive === true || updatedRow.IsActive === 1,
          created_at: updatedRow.CreatedAt,
          updated_at: updatedRow.UpdatedAt,
          categoryids: (cats.recordset || []).map(x => x.category_id),
        },
      });
    } catch (inner) {
      try { await tx.rollback(); } catch {}
      const num = inner?.originalError?.info?.number;
      if (num === 2601 || num === 2627) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      if (num === 547) {
        return res.status(400).json({ error: 'One or more category IDs do not exist' });
      }
      console.error('collections.updateCollection tx error', inner);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (e) {
    console.error('collections.updateCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/* DELETE /api/collections/:id*/
exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!uuidRe.test(id)) {
      return res.status(400).json({ error: 'Invalid collection id format' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(204).send();
    }

    const tx = new sql.Transaction(req.dbPool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input('Id', sql.UniqueIdentifier, id)
        .query(`DELETE FROM dbo.collection_categories WHERE collection_id=@Id`);

      const del = await new sql.Request(tx)
        .input('Id', sql.UniqueIdentifier, id)
        .query(`
          DELETE FROM dbo.collections
          OUTPUT DELETED.Id
          WHERE Id=@Id
        `);

      if (!del.recordset?.[0]) {
        await tx.rollback();
        return res.status(404).json({ error: 'Collection not found' });
      }

      await tx.commit();
      return res.status(204).send();
    } catch (inner) {
      try { await tx.rollback(); } catch {}
      console.error('collections.deleteCollection tx error', inner);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (e) {
    console.error('collections.deleteCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
