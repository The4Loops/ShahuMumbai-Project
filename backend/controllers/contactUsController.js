const supabase = require("../config/supabaseClient");

// Create a new contact message
exports.createContact = async (req, res) => {
  try {
    const { name, email, subject, message, status } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("contact_us")
      .insert([{ name, email, subject, message, status: status || "pending" }])
      .select();
    if (error) throw error;

    return res.status(201).json({ message: "Created successfully" });
  } catch (e) {
    console.error("contact-us.createContact error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

// List all contact messages
exports.getAllContact = async (req, res) => {
  try {
    const {
      status = 'All',
      q = '',
      limit: limitStr = '50',
      offset: offsetStr = '0',
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let queryBuilder = supabase
      .from('contact_us')
      .select('id, name, email, subject, message, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      queryBuilder = queryBuilder.eq('status', status.toLowerCase());
    }

    if (q) {
      // Search by name or email (case-insensitive)
      const like = `%${q}%`;
      queryBuilder = queryBuilder.or(`name.ilike.${like},email.ilike.${like}`);
    }

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    // Map to a minimal shape for the UI
    const contacts = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      subject: c.subject,
      message: c.message,
      status: (c.status || 'pending').replace(/^\w/, c => c.toUpperCase()), // Pending/Resolved/Closed
      created_at: c.created_at,
    }));

    return res.json({ contacts, total: count ?? contacts.length });
  } catch (e) {
    console.error('contact-us.listContacts error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Get a single contact message by ID
exports.getContact = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("contact_us")
      .select("id, name, email, subject, message, status, created_at")
      .eq("id", id)
      .single();
    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const contact = {
      id: data.id,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: (data.status || "pending").replace(/^\w/, (c) => c.toUpperCase()),
      created_at: data.created_at,
    };

    return res.json(contact);
  } catch (e) {
    console.error("contact-us.getContact error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

// Update a contact message by ID
exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, subject, message, status } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (subject) updates.subject = subject;
    if (message) updates.message = message;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabase
      .from("contact_us")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    return res.json({ message: "updated successfully" });
  } catch (e) {
    console.error("contact-us.updateContact error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};

// Delete a contact message by ID
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("contact_us").delete().eq("id", id);
    if (error) throw error;

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (e) {
    console.error("contact-us.deleteContact error", e);
    return res.status(500).json({ error: "internal_error" });
  }
};
