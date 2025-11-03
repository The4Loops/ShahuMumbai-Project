const sql = require('mssql');
const crypto = require('crypto');

function dbReady(req) {
  return req.db && req.db.connected;  // ← FIXED
}

const now = () => new Date();

function buildReviewTree(reviews) {
  const reviewMap = new Map();
  const roots = [];
  (reviews || []).forEach(review => {
    review.replies = [];
    review.date = new Date(review.created_at).toLocaleDateString();
    reviewMap.set(review.id, review);
  });
  (reviews || []).forEach(review => {
    if (review.parent_id) {
      const parent = reviewMap.get(review.parent_id);
      if (parent) parent.replies.push(review);
    } else {
      roots.push(review);
    }
  });
  const sortReplies = (rev) => {
    rev.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    rev.replies.forEach(sortReplies);
  };
  roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  roots.forEach(sortReplies);
  return roots;
}

// POST /api/blogs           (create)
// PUT  /api/blogs/:id       (update)
exports.createOrUpdateBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      status,
      publish_at,
      meta_title,
      meta_description,
      cover_image,
    } = req.body || {};

    if (!title || !slug || !excerpt || !content || !category || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (status !== 'DRAFT' && status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const blogData = {
      title: String(title).trim(),
      slug: String(slug).trim(),
      cover_image: cover_image || null,
      category,
      excerpt: String(excerpt).trim(),
      tags: tags ? (Array.isArray(tags) ? tags : (() => { try { return JSON.parse(tags); } catch { return []; } })()) : [],
      content,
      status,
      publish_at: status === 'PUBLISHED' && publish_at ? new Date(publish_at) : null,
      meta_title: meta_title?.trim() || null,
      meta_description: meta_description?.trim() || null,
      updated_at: now(),
    };

    if (!dbReady(req) && devFakeAllowed()) {
      const fake = { id: crypto.randomUUID(), is_active: true, created_at: now(), ...blogData };
      return res.status(200).json(fake);
    }

    const hasId = Boolean(req.params?.id);

    if (hasId) {
      
      const r = await req.db.request()
        .input('Id', sql.NVarChar(36), req.params.id)
        .input('Title', sql.NVarChar(255), blogData.title)
        .input('Slug', sql.NVarChar(255), blogData.slug)
        .input('CoverImage', sql.NVarChar(1024), blogData.cover_image)
        .input('Category', sql.NVarChar(100), blogData.category)
        .input('Excerpt', sql.NVarChar(sql.MAX), blogData.excerpt)
        .input('Tags', sql.NVarChar(sql.MAX), JSON.stringify(blogData.tags || []))
        .input('Content', sql.NVarChar(sql.MAX), blogData.content)
        .input('Status', sql.NVarChar(16), blogData.status)
        .input('PublishAt', sql.DateTime2, blogData.publish_at)
        .input('MetaTitle', sql.NVarChar(255), blogData.meta_title)
        .input('MetaDesc', sql.NVarChar(500), blogData.meta_description)
        .input('UpdatedAt', sql.DateTime2, blogData.updated_at)
        .query(`
          UPDATE dbo.blogs
          SET title=@Title, slug=@Slug, CoverImage=@CoverImage, category=@Category,
              excerpt=@Excerpt, tags=@Tags, content=@Content, status=@Status,
              PublishAt=@PublishAt, MetaTitle=@MetaTitle, MetaDescription=@MetaDesc,
              UpdatedAt=@UpdatedAt
          OUTPUT INSERTED.*
          WHERE BlogId=@Id AND IsActive='Y'
        `);

      const data = r.recordset?.[0];
      if (!data) return res.status(404).json({ error: 'Blog not found or not active' });
      return res.status(200).json(data);
    } else {
      // INSERT
      const r = await req.db.request()
        .input('Title', sql.NVarChar(255), blogData.title)
        .input('Slug', sql.NVarChar(255), blogData.slug)
        .input('CoverImage', sql.NVarChar(1024), blogData.cover_image)
        .input('Category', sql.NVarChar(100), blogData.category)
        .input('Excerpt', sql.NVarChar(sql.MAX), blogData.excerpt)
        .input('Tags', sql.NVarChar(sql.MAX), JSON.stringify(blogData.tags || []))
        .input('Content', sql.NVarChar(sql.MAX), blogData.content)
        .input('Status', sql.NVarChar(16), blogData.status)
        .input('PublishAt', sql.DateTime2, blogData.publish_at)
        .input('MetaTitle', sql.NVarChar(255), blogData.meta_title)
        .input('MetaDesc', sql.NVarChar(500), blogData.meta_description)
        .input('IsActive', sql.Char(1), 'Y')
        .input('CreatedAt', sql.DateTime2, now())
        .input('UpdatedAt', sql.DateTime2, now())
        .query(`
          INSERT INTO dbo.blogs
            (title, slug, coverimage, category, excerpt, tags, content, status,
             Publishat, MetaTitle, MetaDescription, IsActive, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.*
          VALUES
            (@Title, @Slug, @CoverImage, @Category, @Excerpt, @Tags, @Content, @Status,
             @PublishAt, @MetaTitle, @MetaDesc, @IsActive, @CreatedAt, @UpdatedAt)
        `);

      const data = r.recordset?.[0];
      return res.status(200).json(data);
    }
  } catch (err) {
    console.error('Error in createOrUpdateBlog:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/blogs/:id/reset
exports.resetBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Blog ID is required' });

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Draft reset successfully' });
    }

    const r = await req.db.request()
      .input('Id', sql.NVarChar(36), id)
      .input('UpdatedAt', sql.DateTime2, now())
      .query(`
        UPDATE dbo.blogs
        SET IsActive='Y', updated_at=@UpdatedAt
        OUTPUT INSERTED.id
        WHERE id=@Id AND status='DRAFT' AND is_active='Y'
      `);

    if (!r.recordset?.[0]) return res.status(404).json({ error: 'Draft blog not found' });
    res.status(200).json({ message: 'Draft reset successfully' });
  } catch (err) {
    console.error('Error in resetBlog:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs/:id
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Blog ID is required" });

    // ✅ Fetch blog by ID
    const blogQuery = await req.db.request()
      .input("Id", sql.Int, id)
      .query(`SELECT * FROM dbo.blogs WHERE BlogId=@Id AND IsActive='Y'`);

    const blogData = blogQuery.recordset?.[0];
    if (!blogData)
      return res
        .status(404)
        .json({ error: "Blog not found or not active" });

    // ✅ Parse Tags safely
    try {
      blogData.Tags = JSON.parse(blogData.Tags || "[]");
    } catch {
      blogData.Tags = [];
    }

    // ✅ Fetch reviews
    const reviewsQuery = await req.db.request()
      .input("BlogId", sql.Int, id)
      .query(
        `SELECT * FROM dbo.BlogReviews WHERE BlogId=@BlogId ORDER BY CreatedAt ASC`
      );

    const allReviews = reviewsQuery.recordset || [];
    const reviewMap = new Map();
    const topLevelReviews = [];

    // Build reply tree
    allReviews.forEach((review) => {
      review.replies = [];
      reviewMap.set(review.BlogReviewId, review);
    });

    allReviews.forEach((review) => {
      if (review.ParentId) {
        const parent = reviewMap.get(review.ParentId);
        if (parent) parent.replies.push(review);
      } else {
        topLevelReviews.push(review);
      }
    });

    // Sort reviews
    const sortReplies = (replies) => {
      replies.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
      replies.forEach((r) => {
        if (r.replies?.length > 0) sortReplies(r.replies);
      });
    };

    topLevelReviews.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    topLevelReviews.forEach((r) => sortReplies(r.replies));

    // ✅ Build final response
    const responseData = {
      ...blogData,
      reviews: topLevelReviews,
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error in getBlogById:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs/drafts
exports.getUserDrafts = async (_req, res) => {
  try {
    if (!dbReady(_req) && devFakeAllowed()) {
      return res.status(200).json([{
        id: crypto.randomUUID(),
        title: 'Draft Blog',
        slug: 'draft-blog',
        status: 'DRAFT',
        is_active: true,
        updated_at: now(),
      }]);
    }

    const r = await _req.db.request().query(`
      SELECT * FROM dbo.blogs
      WHERE Status='DRAFT' AND IsActive='Y'
      ORDER BY UpdatedAt DESC
    `);

    const processedRecords = (r.recordset || []).map(record => {
      let tagsStr = record.Tags; // Use 'Tags' to match DB column casing
      if (tagsStr && typeof tagsStr === 'string') {
        try {
          // Convert {a,b} to [a,b] for valid JSON array if needed
          if (tagsStr.startsWith('{') && tagsStr.endsWith('}')) {
            tagsStr = '[' + tagsStr.slice(1, -1) + ']';
          }
          // Now parse as JSON array
          record.Tags = JSON.parse(tagsStr);
        } catch (parseErr) {
          console.warn('Failed to parse Tags for BlogId:', record.BlogId, parseErr, 'Raw value:', tagsStr);
          record.Tags = []; // Fallback to empty array
        }
      } else {
        record.Tags = []; // Handle null/empty/non-string
      }
      return record;
    });
    r.recordset = processedRecords;
    res.status(200).json(r.recordset || []);
  } catch (err) {
    console.error('Error in getUserDrafts:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs
exports.getAllBlogs = async (req, res) => {
  try {

    // ✅ Fetch blogs
    const blogsRes = await req.db.request().query(`
      SELECT * FROM dbo.blogs
      WHERE Status = 'PUBLISHED' AND IsActive = 'Y'
      ORDER BY PublishAt DESC
    `);

    const blogs = blogsRes.recordset || [];
    if (!blogs.length) return res.status(200).json([]);

    // ✅ Get blog IDs
    const blogIds = blogs.map((b) => b.BlogId);
    const inList = blogIds.map((_, i) => `@B${i}`).join(",");
    const rReq = req.db.request();
    blogIds.forEach((id, i) => rReq.input(`B${i}`, sql.Int, id));

    // ✅ Fetch reviews
    const reviewsRes = await rReq.query(`
      SELECT 
        BlogReviewId AS id,
        BlogId AS blog_id,
        ParentId AS parent_id,
        UserId AS user_id,
        Name AS name,
        CreatedAt AS created_at,
        Text AS text,
        Stars AS stars
      FROM dbo.BlogReviews
      WHERE BlogId IN (${inList})
      ORDER BY CreatedAt ASC
    `);

    const allReviews = reviewsRes.recordset || [];
    const byBlog = allReviews.reduce((acc, rev) => {
      (acc[rev.blog_id] ||= []).push(rev);
      return acc;
    }, {});

    // ✅ Attach parsed Tags & reviews
    blogs.forEach((b) => {
      // Convert Tags to array
      try {
        b.Tags = JSON.parse(b.Tags || "[]");
      } catch {
        b.Tags = [];
      }

      // Attach review tree
      b.reviews = buildReviewTree(byBlog[b.BlogId] || []);
    });

    // ✅ Send response
    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error in getAllBlogs:", error);
    res.status(500).json({
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};

// GET /api/blogs/likes?user_id=...
exports.getUserLikes = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ message: 'User ID is required' });

  try {
    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ likedBlogIds: [] });
    }

    const r = await req.db.request()
      .input('UserId', sql.NVarChar(128), String(user_id))
      .query(`
        SELECT BlogId AS blog_id
        FROM dbo.UserInteractions
        WHERE UserId=@UserId AND ActionType='LIKE'
      `);

    const likedBlogIds = (r.recordset || []).map(x => x.blog_id);
    res.status(200).json({ likedBlogIds });
  } catch (error) {
    console.error('Error in getUserLikes:', error);
    res.status(500).json({ message: 'Failed to fetch user likes', error: error.message });
  }
};

// POST /api/blogs/:id/reviews
exports.addReview = async (req, res) => {
  const { id } = req.params;
  const { user_id, name, text, stars } = req.body || {};
  try {
    if (!user_id || !name || !text || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Invalid review data' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      const created = {
        blog_id: id,
        parent_id: null,
        user_id, name, text, stars,
        created_at: now()
      };
      created.date = new Date(created.created_at).toLocaleDateString();
      created.replies = [];
      return res.status(200).json(created);
    }

    const r = await req.db.request()
      .input('BlogId', sql.NVarChar(36), id)
      .input('ParentId', sql.NVarChar(36), null)
      .input('UserId', sql.NVarChar(128), String(user_id))
      .input('Name', sql.NVarChar(120), String(name))
      .input('Text', sql.NVarChar(sql.MAX), String(text))
      .input('Stars', sql.Int, stars)
      .input('CreatedAt', sql.DateTime2, now())
      .query(`
        INSERT INTO dbo.blogreviews (BlogId, ParentId, UserId, name, text, stars, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@BlogId, @ParentId, @UserId, @Name, @Text, @Stars, @CreatedAt)
      `);

    const data = r.recordset?.[0];
    data.date = new Date(data.CreatedAt).toLocaleDateString();
    data.replies = [];
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in addReview:', error);
    res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
};

// POST /api/blogs/:id/reviews/:reviewId/replies
exports.addReply = async (req, res) => {
  const { id, reviewId } = req.params;
  const { user_id, name, text } = req.body || {};

  try {
    if (!user_id || !name || !text) {
      return res.status(400).json({ message: 'Invalid reply data' });
    }

    if (!dbReady(req) && devFakeAllowed()) {
      const data = {
        blog_id: id,
        parent_id: reviewId,
        user_id, name, text,
        stars: null,
        created_at: now()
      };
      data.date = new Date(data.created_at).toLocaleDateString();
      return res.status(200).json(data);
    }

    const r = await req.db.request()
      .input('BlogId', sql.NVarChar(36), id)
      .input('ParentId', sql.NVarChar(36), reviewId)
      .input('UserId', sql.NVarChar(128), String(user_id))
      .input('Name', sql.NVarChar(120), String(name))
      .input('Text', sql.NVarChar(sql.MAX), String(text))
      .input('Stars', sql.Int, null)
      .input('CreatedAt', sql.DateTime2, now())
      .query(`
        INSERT INTO dbo.blogreviews (BlogId, ParentId, UserId, name, text, stars, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@BlogId, @ParentId, @UserId, @Name, @Text, @Stars, @CreatedAt)
      `);

    const data = r.recordset?.[0];
    data.date = new Date(data.CreatedAt).toLocaleDateString();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in addReply:', error);
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
};

// POST /api/blogs/:id/like
exports.incrementLikes = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ message: 'User ID is required' });

  try {
    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ likes: 1 });
    }

    const request = req.db.request()
      .input('BlogId', sql.NVarChar(36), id)
      .input('UserId', sql.Int, Number(user_id))
      .input('Action', sql.NVarChar(16), 'LIKE')
      .input('CreatedAt', sql.DateTime2, now());

    const exists = await request.query(`
      SELECT 1 FROM dbo.UserInteractions
      WHERE BlogId=@BlogId AND UserId=@UserId AND ActionType='LIKE'
    `);
    if (exists.recordset?.[0]) {
      return res.status(400).json({ message: 'User has already liked this blog' });
    }

    await req.db.request()
      .input('BlogId', sql.Int, Number(id))
      .input('UserId', sql.Int, Number(user_id))
      .input('Action', sql.NVarChar(16), 'LIKE')
      .input('CreatedAt', sql.DateTime2, now())
      .query(`
        INSERT INTO dbo.UserInteractions (BlogId, userId, ActionType, CreatedAt)
        VALUES (@BlogId, @UserId, @Action, @CreatedAt)
      `);

      await req.db.request()
      .input('BlogId', sql.Int, Number(id))
      .query(`
        Update Blogs set Likes=Likes+1
        WHERE BlogId=@BlogId
      `);

    const countRes = await req.db.request()
      .input('BlogId', sql.Int, Number(id))
      .query(`SELECT COUNT(*) AS Likes FROM dbo.UserInteractions WHERE BlogId = @BlogId and ActionType='LIKE'`);

    res.status(200).json({ Likes: countRes.recordset?.[0]?.Likes || 0 });
  } catch (error) {
    console.error('Error in incrementLikes:', error);
    res.status(500).json({ message: 'Failed to like blog', error: error.message });
  }
};

// POST /api/blogs/:id/view
exports.incrementViews = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ message: 'User ID is required' });

  try {
    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ views: 1 });
    }

    const ex = await req.db.request()
      .input('BlogId', sql.Int, id)
      .input('UserId', sql.Int, Number(user_id))
      .query(`
        SELECT 1 FROM dbo.UserInteractions
        WHERE BlogId=@BlogId AND UserId=@UserId AND ActionType='VIEW'
      `);

    if (!ex.recordset?.[0]) {
      await req.db.request()
        .input('BlogId', sql.Int, id)
        .input('UserId', sql.Int, Number(user_id))
        .input('Action', sql.NVarChar(16), 'VIEW')
        .input('CreatedAt', sql.DateTime2, now())
        .query(`
          INSERT INTO dbo.UserInteractions (BlogId, UserId, ActionType, CreatedAt)
          VALUES (@BlogId, @UserId, @Action, @CreatedAt)
        `);
      
      await req.db.request()
      .input('BlogId', sql.Int, Number(id))
      .query(`
        Update Blogs set Views=Views+1
        WHERE BlogId=@BlogId
      `);  
    }

    const countRes = await req.db.request()
      .input('BlogId', sql.NVarChar(36), id)
      .query(`SELECT COUNT(*) AS views FROM dbo.UserInteractions WHERE BlogId=@BlogId AND ActionType='VIEW'`);

    res.status(200).json({ views: countRes.recordset?.[0]?.views || 0 });
  } catch (error) {
    console.error('Error in incrementViews:', error);
    res.status(500).json({ message: 'Failed to increment views', error: error.message });
  }
};

// DELETE /api/blogs/:id
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Blog ID is required' });
    if (!uuidRegex.test(id)) return res.status(400).json({ error: 'Invalid UUID format' });

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({ message: 'Blog and associated reviews deleted successfully' });
    }

    await req.db.request()
      .input('BlogId', sql.NVarChar(36), id)
      .query(`DELETE FROM dbo.blogreviews WHERE blog_id=@BlogId`);

    const del = await req.db.request()
      .input('Id', sql.NVarChar(36), id)
      .query(`DELETE FROM dbo.blogs OUTPUT DELETED.id WHERE id=@Id`);

    if (!del.recordset?.[0]) {
      return res.status(404).json({ error: 'Blog not found or already deleted' });
    }

    res.status(200).json({ message: 'Blog and associated reviews deleted successfully' });
  } catch (err) {
    console.error('Error in deleteBlog:', err);
    res.status(500).json({ error: err.message });
  }
};
