const supabase = require("../config/supabaseClient");

// GET /api/collections
exports.listCollections = async (req, res) => {
  try {
    const {
      q = "",
      status,
      is_active,
      limit: limitStr = "50",
      offset: offsetStr = "0",
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let queryBuilder = supabase
      .from("collections")
      .select(
        "id, title, slug, description, cover_image, status, is_active, created_at, updated_at, collection_categories(category_id)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (q) {
      const like = `%${q}%`;
      queryBuilder = queryBuilder.or(
        `title.ilike.${like},slug.ilike.${like},description.ilike.${like}`
      );
    }
    if (status) {
      queryBuilder = queryBuilder.eq("status", status.toUpperCase());
    }
    if (is_active !== undefined && is_active !== "") {
      queryBuilder = queryBuilder.eq("is_active", is_active === "true");
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: collections, error: collectionsError, count } = await queryBuilder;
    if (collectionsError) throw collectionsError;

    // Product counts
    const ids = (collections || []).map((c) => c.id);
    let counts = {};
    if (ids.length) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("collectionid")
        .in("collectionid", ids);
      if (productsError) throw productsError;

      counts = (products || []).reduce((acc, { collectionid }) => {
        acc[collectionid] = (acc[collectionid] || 0) + 1;
        return acc;
      }, {});
    }

    // Format collections to include categoryids array
    const formatted = (collections || []).map((c) => ({
      ...c,
      product_count: counts[c.id] || 0,
      categoryids: c.collection_categories ? c.collection_categories.map(cc => cc.category_id) : [],
    }));

    return res.json({ collections: formatted, total: count ?? formatted.length });
  } catch (e) {
    console.error("collections.listCollections error", e);
    return res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
};

// GET /api/collections/:id
exports.getCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("collections")
      .select(
        "id, title, slug, description, cover_image, status, is_active, created_at, updated_at, collection_categories(category_id)"
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Collection not found" });

    // Format response to include categoryids array
    const responseData = {
      ...data,
      categoryids: data.collection_categories ? data.collection_categories.map(cc => cc.category_id) : [],
    };
    delete responseData.collection_categories;

    return res.json(responseData);
  } catch (e) {
    console.error("collections.getCollection error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/collections
exports.createCollection = async (req, res) => {
  try {
    const { title, slug, description, cover_image, status, is_active, categoryids } = req.body;

    // Validate required fields
    if (!title || !slug || !status || !categoryids || !Array.isArray(categoryids) || categoryids.length === 0) {
      return res.status(400).json({ error: "Missing or invalid required fields: title, slug, status, categoryids (must be a non-empty array)" });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" });
    }

    // Validate categoryids format (assuming UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const categoryid of categoryids) {
      if (!uuidRegex.test(categoryid)) {
        return res.status(400).json({ error: `Invalid category ID format: ${categoryid}` });
      }
    }

    // Start a transaction to ensure atomicity
    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .insert([
        {
          title,
          slug: String(slug).trim().toLowerCase(),
          description,
          cover_image,
          status: String(status).toUpperCase(),
          is_active: !!is_active,
        },
      ])
      .select()
      .single();

    if (collectionError) {
      if (collectionError.code === "23505") {
        return res.status(400).json({ error: "Slug already exists" });
      }
      throw collectionError;
    }

    // Insert category relationships into junction table
    const categoryInserts = categoryids.map(categoryid => ({
      collection_id: collectionData.id,
      category_id: categoryid,
    }));

    const { error: categoryError } = await supabase
      .from("collection_categories")
      .insert(categoryInserts);

    if (categoryError) {
      if (categoryError.code === "23503") {
        return res.status(400).json({ error: "One or more category IDs do not exist" });
      }
      throw categoryError;
    }

    // Fetch the collection with associated category IDs
    const { data: finalData, error: fetchError } = await supabase
      .from("collections")
      .select(`
        id, title, slug, description, cover_image, status, is_active, created_at, updated_at,
        collection_categories(category_id)
      `)
      .eq("id", collectionData.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Format response to include categoryids array
    const responseData = {
      ...finalData,
      categoryids: finalData.collection_categories ? finalData.collection_categories.map(cc => cc.category_id) : [],
    };
    delete responseData.collection_categories;

    return res.status(201).json({ message: "Collection created successfully", collection: responseData });
  } catch (e) {
    console.error("collections.createCollection error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /api/collections/:id
exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, cover_image, status, is_active, categoryids } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) {
      updates.slug = String(slug).trim().toLowerCase();
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" });
      }
    }
    if (description !== undefined) updates.description = description;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (status !== undefined) updates.status = String(status).toUpperCase();
    if (is_active !== undefined) updates.is_active = !!is_active;

    // Validate categoryids if provided
    if (categoryids !== undefined) {
      if (!Array.isArray(categoryids) || categoryids.length === 0) {
        return res.status(400).json({ error: "categoryids must be a non-empty array" });
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const categoryid of categoryids) {
        if (!uuidRegex.test(categoryid)) {
          return res.status(400).json({ error: `Invalid category ID format: ${categoryid}` });
        }
      }
    }

    if (!Object.keys(updates).length && categoryids === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Start a transaction
    if (Object.keys(updates).length) {
      const { data, error } = await supabase
        .from("collections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res.status(400).json({ error: "Slug already exists" });
        }
        throw error;
      }
      if (!data) {
        return res.status(404).json({ error: "Collection not found" });
      }
    }

    // Update category relationships if provided
    if (categoryids !== undefined) {
      // Delete existing category relationships
      const { error: deleteError } = await supabase
        .from("collection_categories")
        .delete()
        .eq("collection_id", id);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new category relationships
      const categoryInserts = categoryids.map(categoryid => ({
        collection_id: id,
        category_id: categoryid,
      }));

      const { error: insertError } = await supabase
        .from("collection_categories")
        .insert(categoryInserts);

      if (insertError) {
        if (insertError.code === "23503") {
          return res.status(400).json({ error: "One or more category IDs do not exist" });
        }
        throw insertError;
      }
    }

    // Fetch the updated collection with associated category IDs
    const { data: finalData, error: fetchError } = await supabase
      .from("collections")
      .select(`
        id, title, slug, description, cover_image, status, is_active, created_at, updated_at,
        collection_categories(category_id)
      `)
      .eq("id", id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Format response to include categoryids array
    const responseData = {
      ...finalData,
      categoryids: finalData.collection_categories ? finalData.collection_categories.map(cc => cc.category_id) : [],
    };
    delete responseData.collection_categories;

    return res.status(200).json({ message: "Collection updated successfully", collection: responseData });
  } catch (e) {
    console.error("collections.updateCollection error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/collections/:id
exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) throw error;
    return res.status(204).send();
  } catch (e) {
    console.error("collections.deleteCollection error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};