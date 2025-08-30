const supabase = require("../config/supabaseClient");

// List all collections with filtering
exports.listCollections = async (req, res) => {
  try {
    const { q = '', status, is_active, limit: limitStr = '50', offset: offsetStr = '0' } = req.query;
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let queryBuilder = supabase
      .from('collections')
      .select('id, title, slug, description, cover_image, status, is_active, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (q) {
      const like = `%${q}%`;
      queryBuilder = queryBuilder.or(`title.ilike.${like},slug.ilike.${like},description.ilike.${like}`);
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status.toUpperCase());
    }
    if (is_active !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', is_active === 'true');
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    return res.json({ collections: data || [], total: count ?? data.length });
  } catch (e) {
    console.error('collections.listCollections error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single collection by ID
exports.getCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('collections')
      .select('id, title, slug, description, cover_image, status, is_active, created_at, updated_at')
      .eq('id', id)
      .single();
    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.json(data);
  } catch (e) {
    console.error('collections.getCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new collection
exports.createCollection = async (req, res) => {
  try {
    const { title, slug, description, cover_image, status, is_active } = req.body;

    if (!title || !slug || !status) {
      return res.status(400).json({ error: 'Missing required fields: title, slug, status' });
    }

    const { data, error } = await supabase
      .from('collections')
      .insert([{ title, slug, description, cover_image, status: status.toUpperCase(), is_active: !!is_active }])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      throw error;
    }

    return res.status(201).json(data);
  } catch (e) {
    console.error('collections.createCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a collection by ID
exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, cover_image, status, is_active } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (slug) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (status) updates.status = status.toUpperCase();
    if (is_active !== undefined) updates.is_active = !!is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.json(data);
  } catch (e) {
    console.error('collections.updateCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a collection by ID
exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    if (error) throw error;

    return res.status(204).send();
  } catch (e) {
    console.error('collections.deleteCollection error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};