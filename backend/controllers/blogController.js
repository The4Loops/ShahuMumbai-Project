const supabase = require("../config/supabaseClient");

function buildReviewTree(reviews) {
  const reviewMap = new Map();
  const roots = [];
  reviews.forEach(review => {
    review.replies = [];
    review.date = new Date(review.created_at).toLocaleDateString();
    reviewMap.set(review.id, review);
  });
  reviews.forEach(review => {
    if (review.parent_id) {
      const parent = reviewMap.get(review.parent_id);
      if (parent) {
        parent.replies.push(review);
      }
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

// Create or Update Blog
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
    } = req.body;

    if (!title || !slug || !excerpt || !content || !category || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (status !== "DRAFT" && status !== "PUBLISHED") {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const blogData = {
      title: title.trim(),
      slug: slug.trim(),
      cover_image: cover_image || null,
      category,
      excerpt: excerpt.trim(),
      tags: tags ? JSON.parse(tags) : [],
      content,
      status,
      publish_at: status === "PUBLISHED" && publish_at ? publish_at : null,
      meta_title: meta_title?.trim() || null,
      meta_description: meta_description?.trim() || null,
      updated_at: new Date(),
    };

    let data, error;
    if (req.params.id) {
      ({ data, error } = await supabase
        .from("blogs")
        .update(blogData)
        .eq("id", req.params.id)
        .eq("is_active", true)
        .select()
        .single());
      if (!data) {
        return res.status(404).json({ error: "Blog not found or not active" });
      }
    } else {
      ({ data, error } = await supabase
        .from("blogs")
        .insert(blogData)
        .select()
        .single());
    }

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in createOrUpdateBlog:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reset Blog (Soft Delete Draft)
exports.resetBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Blog ID is required" });
    }

    const { data, error } = await supabase
      .from("blogs")
      .update({ is_active: false, updated_at: new Date() })
      .eq("id", id)
      .eq("status", "DRAFT")
      .eq("is_active", true)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Draft blog not found" });
    }

    res.status(200).json({ message: "Draft reset successfully" });
  } catch (err) {
    console.error("Error in resetBlog:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Blog by ID (for editing)
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Blog ID is required" });
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: "Invalid UUID format" });
    }

    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Blog not found or not active" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in getBlogById:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get User's Drafts
exports.getUserDrafts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("status", "DRAFT")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error in getUserDrafts:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Blogs with Reviews
exports.getAllBlogs = async (req, res) => {
  try {
    const { data: blogs, error: blogError } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'PUBLISHED')
      .order('publish_at', { ascending: false });

    if (blogError) {
      throw new Error(blogError.message);
    }

    const blogIds = blogs.map(b => b.id);
    const { data: allReviews, error: reviewError } = await supabase
      .from('blogreviews')
      .select('id, blog_id, parent_id, user_id, name, created_at, text, stars')
      .in('blog_id', blogIds)
      .order('created_at', { ascending: true });

    if (reviewError) {
      throw new Error(reviewError.message);
    }

    const reviewsByBlog = allReviews.reduce((acc, rev) => {
      if (!acc[rev.blog_id]) acc[rev.blog_id] = [];
      acc[rev.blog_id].push(rev);
      return acc;
    }, {});

    blogs.forEach(blog => {
      const blogReviews = reviewsByBlog[blog.id] || [];
      blog.reviews = buildReviewTree(blogReviews);
    });

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error in getAllBlogs:", error);
    res.status(500).json({ message: 'Failed to fetch blogs', error: error.message });
  }
};

// Get User's Likes
exports.getUserLikes = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('blog_id')
      .eq('user_id', user_id)
      .eq('action_type', 'LIKE');

    if (error) {
      throw new Error(error.message);
    }

    const likedBlogIds = data.map(item => item.blog_id);
    res.status(200).json({ likedBlogIds });
  } catch (error) {
    console.error("Error in getUserLikes:", error);
    res.status(500).json({ message: 'Failed to fetch user likes', error: error.message });
  }
};

// Add Review to Blog
exports.addReview = async (req, res) => {
  const { id } = req.params;
  const { user_id, name, text, stars } = req.body;

  try {
    if (!user_id || !name || !text || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Invalid review data' });
    }

    const { data, error } = await supabase
      .rpc('add_review', {
        p_user_id: user_id,
        p_blog_id: id,
        p_name: name,
        p_text: text,
        p_stars: stars
      })
      .single();

    if (error) {
      throw new Error(error.message);
    }

    data.date = new Date(data.created_at).toLocaleDateString();
    data.replies = [];

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in addReview:", error);
    res.status(500).json({ message: 'Failed to add review', error: error.message });
  }
};

// Add Reply to Review
exports.addReply = async (req, res) => {
  const { id, reviewId } = req.params;
  const { user_id, name, text } = req.body;

  try {
    if (!user_id || !name || !text) {
      return res.status(400).json({ message: 'Invalid reply data' });
    }

    const { data, error } = await supabase
      .from('blogreviews')
      .insert({
        blog_id: id,
        parent_id: reviewId,
        user_id,
        name,
        text,
        stars: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    data.date = new Date(data.created_at).toLocaleDateString();

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in addReply:", error);
    res.status(500).json({ message: 'Failed to add reply', error: error.message });
  }
};

// Increment Likes for a Blog
exports.incrementLikes = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const { data, error } = await supabase
      .rpc('like_blog', { p_user_id: user_id, p_blog_id: id });

    if (error) {
      if (error.message === 'User has already liked this blog') {
        return res.status(400).json({ message: error.message });
      }
      throw new Error(error.message);
    }

    res.status(200).json({ likes: data });
  } catch (error) {
    console.error("Error in incrementLikes:", error);
    res.status(500).json({ message: 'Failed to like blog', error: error.message });
  }
};

// Increment Views for a Blog
exports.incrementViews = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const { data, error } = await supabase
      .rpc('view_blog', { p_user_id: user_id, p_blog_id: id });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({ views: data });
  } catch (error) {
    console.error("Error in incrementViews:", error);
    res.status(500).json({ message: 'Failed to increment views', error: error.message });
  }
};