const nodemailer = require("nodemailer");
const supabase = require("../config/supabaseClient");

// List all team members with filtering, search, and pagination
exports.listTeamMembers = async (req, res) => {
  try {
    const {
      team_type = 'All',
      q = '',
      limit: limitStr = '50',
      offset: offsetStr = '0',
    } = req.query;

    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetStr, 10) || 0, 0);

    let queryBuilder = supabase
      .from('team_members')
      .select('id, name, role, description, color, team_type, created_at', { count: 'exact' })
      .order('name', { ascending: true });

    if (team_type && team_type !== 'All') {
      queryBuilder = queryBuilder.eq('team_type', team_type.toLowerCase());
    }

    if (q) {
      // Search by name, role, or description (case-insensitive)
      const like = `%${q}%`;
      queryBuilder = queryBuilder.or(`name.ilike.${like},role.ilike.${like},description.ilike.${like}`);
    }

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    // Map to include initials (generated)
    const members = (data || []).map(m => ({
      id: m.id,
      initials: m.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      name: m.name,
      role: m.role,
      desc: m.description,
      color: m.color,
      team_type: m.team_type,
      created_at: m.created_at,
    }));

    return res.json({ members, total: count ?? members.length });
  } catch (e) {
    console.error('team-members.listTeamMembers error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Create a new team member
exports.createTeamMember = async (req, res) => {
  try {
    const { name, role, description, color, team_type } = req.body;
    if (!name || !role || !team_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([{ name, role, description, color: color || 'bg-pink-500', team_type }])
      .select();
    if (error) throw error;

    return res.status(201).json({message:"created successfully"});
  } catch (e) {
    console.error('team-members.createTeamMember error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Get a single team member by ID
exports.getTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, role, description, color, team_type, created_at')
      .eq('id', id)
      .single();
    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const member = {
      id: data.id,
      initials: data.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      name: data.name,
      role: data.role,
      desc: data.description,
      color: data.color,
      team_type: data.team_type,
      created_at: data.created_at,
    };

    return res.json(member);
  } catch (e) {
    console.error('team-members.getTeamMember error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Update a team member by ID
exports.updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, description, color, team_type } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (description !== undefined) updates.description = description;
    if (color) updates.color = color;
    if (team_type) updates.team_type = team_type;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    return res.status(200).json({message:"updated successfully"});
  } catch (e) {
    console.error('team-members.updateTeamMember error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};

// Delete a team member by ID
exports.deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
    if (error) throw error;

    return res.status(200).json({message:"deleted successfully"});
  } catch (e) {
    console.error('team-members.deleteTeamMember error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
};