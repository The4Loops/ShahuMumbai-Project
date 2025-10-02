const sql = require('mssql');
const crypto = require('crypto');

function dbReady(req) {
  return req.dbPool && req.dbPool.connected;
}
function devFakeAllowed() {
  return process.env.ALLOW_FAKE === '1';
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
      
      const r = await req.dbPool.request()
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
      const id = crypto.randomUUID();
      const r = await req.dbPool.request()
        .input('Id', sql.NVarChar(36), id)
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
            (id, title, slug, coverimage, category, excerpt, tags, content, status,
             Publishat, MetaTitle, MetaDescription, IsActive, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.*
          VALUES
            (@Id, @Title, @Slug, @CoverImage, @Category, @Excerpt, @Tags, @Content, @Status,
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

    const r = await req.dbPool.request()
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
    if (!id) return res.status(400).json({ error: 'Blog ID is required' });

    if (!dbReady(req) && devFakeAllowed()) {
      return res.status(200).json({
        id,
        title: 'Sample Blog',
        slug: 'sample-blog',
        excerpt: 'Lorem ipsum',
        content: '<p>content</p>',
        category: 'General',
        tags: JSON.stringify(['sample']),
        status: 'DRAFT',
        is_active: true,
        created_at: now(),
        updated_at: now(),
        reviews: [
          {
            BlogReviewId: 1,
            BlogId: id,
            ParentId: null,
            UserId: 1,
            Name: 'John',
            CreatedAt: new Date().toISOString(),
            Text: 'Amazing insights!',
            Stars: 5,
            replies: [
              {
                BlogReviewId: 11,
                BlogId: id,
                ParentId: 1,
                UserId: 2,
                Name: 'Alice',
                CreatedAt: new Date().toISOString(),
                Text: 'Totally agree!',
                Stars: null,
                replies: [
                  {
                    BlogReviewId: 111,
                    BlogId: id,
                    ParentId: 11,
                    UserId: 3,
                    Name: 'Mike',
                    CreatedAt: new Date().toISOString(),
                    Text: 'Same here!',
                    Stars: null,
                    replies: [],
                  },
                ],
              },
            ],
          },
          {
            BlogReviewId: 2,
            BlogId: id,
            ParentId: null,
            UserId: 4,
            Name: 'Sarah',
            CreatedAt: new Date().toISOString(),
            Text: 'Great read but needs more examples.',
            Stars: 4,
            replies: [],
          },
        ],
      });
    }

    const blogQuery = await req.dbPool.request()
      .input('Id', sql.NVarChar(36), id)
      .query(`SELECT * FROM dbo.blogs WHERE BlogId=@Id AND IsActive='Y'`);

    const blogData = blogQuery.recordset?.[0];
    if (!blogData) return res.status(404).json({ error: 'Blog not found or not active' });

    const reviewsQuery = await req.dbPool.request()
      .input('BlogId', sql.NVarChar(36), id)
      .query(`SELECT * FROM dbo.blogreviews WHERE BlogId=@BlogId ORDER BY CreatedAt ASC`);

    const allReviews = reviewsQuery.recordset || [];
    const reviewMap = new Map();
    const topLevelReviews = [];

    allReviews.forEach(review => {
      review.replies = [];
      reviewMap.set(review.BlogReviewId, review);
    });

    allReviews.forEach(review => {
      if (review.ParentId) {
        const parent = reviewMap.get(review.ParentId);
        if (parent) {
          parent.replies.push(review);
        }
      } else {
        topLevelReviews.push(review);
      }
    });

    topLevelReviews.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    topLevelReviews.forEach(review => {
      if (review.replies.length > 0) {
        review.replies.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
        // Recursively sort nested replies
        const sortReplies = (replies) => {
          replies.forEach(r => {
            if (r.replies.length > 0) {
              r.replies.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
              sortReplies(r.replies);
            }
          });
        };
        sortReplies(review.replies);
      }
    });

    const responseData = {
      ...blogData,
      reviews: topLevelReviews,
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error in getBlogById:', err);
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

    const r = await _req.dbPool.request().query(`
      SELECT * FROM dbo.blogs
      WHERE status='DRAFT' AND is_active='Y'
      ORDER BY UpdatedAt DESC
    `);

    res.status(200).json(r.recordset || []);
  } catch (err) {
    console.error('Error in getUserDrafts:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs
exports.getAllBlogs = async (req, res) => {
  try {
    if (!dbReady(req) && devFakeAllowed()) {
      const id = crypto.randomUUID();
      return res.status(200).json([{
        id,
        title: 'Hello World',
        slug: 'hello-world',
        status: 'PUBLISHED',
        publish_at: now(),
        is_active: 1,
        reviews: buildReviewTree([{
          id: crypto.randomUUID(),
          blog_id: id,
          parent_id: null,
          user_id: 'u1',
          name: 'Alice',
          created_at: now(),
          text: 'Great post!',
          stars: 5,
        }]),
      }]);
    }

    const blogsRes = await req.dbPool.request().query(`
      SELECT * FROM dbo.blogs
      WHERE status='PUBLISHED' AND isActive='Y'
      ORDER BY PublishAt DESC
    `);

    const blogs = blogsRes.recordset || [];
    if (!blogs.length) return res.status(200).json([]);

    const blogIds = blogs.map(b => b.id);
  
    const inList = blogIds.map((_, i) => `@B${i}`).join(',');
    const rReq = req.dbPool.request();
    blogIds.forEach((id, i) => rReq.input(`B${i}`, sql.NVarChar(36), id));

    const reviewsRes = await rReq.query(`
      SELECT BlogReviewId AS id, BlogId AS blog_id,ParentId AS parent_id,UserId AS user_id, name,CreatedAt AS created_at, text, stars
      FROM dbo.BlogReviews
      WHERE BlogId IN (${inList})
      ORDER BY CreatedAt ASC
    `);

    const allReviews = reviewsRes.recordset || [];
    const byBlog = allReviews.reduce((acc, rev) => {
      (acc[rev.blog_id] ||= []).push(rev);
      return acc;
    }, {});

    blogs.forEach(b => {
      b.reviews = buildReviewTree(byBlog[b.id] || []);
    });

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error in getAllBlogs:', error);
    res.status(500).json({ message: 'Failed to fetch blogs', error: error.message });
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

    const r = await req.dbPool.request()
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

    const r = await req.dbPool.request()
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

    const r = await req.dbPool.request()
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

    const request = req.dbPool.request()
      .input('BlogId', sql.NVarChar(36), id)
      .input('UserId', sql.NVarChar(128), String(user_id))
      .input('Action', sql.NVarChar(16), 'LIKE')
      .input('CreatedAt', sql.DateTime2, now());

    const exists = await request.query(`
      SELECT 1 FROM dbo.UserInteractions
      WHERE BlogId=@BlogId AND UserId=@UserId AND ActionType='LIKE'
    `);
    if (exists.recordset?.[0]) {
      return res.status(400).json({ message: 'User has already liked this blog' });
    }

    await req.dbPool.request()
      .input('BlogId', sql.NVarChar(36), id)
      .input('UserId', sql.NVarChar(128), String(user_id))
      .input('Action', sql.NVarChar(16), 'LIKE')
      .input('CreatedAt', sql.DateTime2, now())
      .query(`
        INSERT INTO dbo.UserInteractions (BlogId, userId, ActionType, CreatedAt)
        VALUES (@BlogId, @UserId, @Action, @CreatedAt)
      `);

    const countRes = await req.dbPool.request()
      .input('BlogId', sql.NVarChar(36), id)
      .query(`SELECT COUNT(*) AS likes FROM dbo.UserInteractions WHERE BlogId=@BlogId AND ActionType='LIKE'`);

    res.status(200).json({ likes: countRes.recordset?.[0]?.likes || 0 });
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

    const ex = await req.dbPool.request()
      .input('BlogId', sql.NVarChar(36), id)
      .input('UserId', sql.NVarChar(128), String(user_id))
      .query(`
        SELECT 1 FROM dbo.UserInteractions
        WHERE BlogId=@BlogId AND UserId=@UserId AND ActionType='VIEW'
      `);

    if (!ex.recordset?.[0]) {
      await req.dbPool.request()
        .input('BlogId', sql.NVarChar(36), id)
        .input('UserId', sql.NVarChar(128), String(user_id))
        .input('Action', sql.NVarChar(16), 'VIEW')
        .input('CreatedAt', sql.DateTime2, now())
        .query(`
          INSERT INTO dbo.UserInteractions (BlogId, UserId, ActionType, CreatedAt)
          VALUES (@BlogId, @UserId, @Action, @CreatedAt)
        `);
    }

    const countRes = await req.dbPool.request()
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

    await req.dbPool.request()
      .input('BlogId', sql.NVarChar(36), id)
      .query(`DELETE FROM dbo.blogreviews WHERE blog_id=@BlogId`);

    const del = await req.dbPool.request()
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
