// Designer and ProductDesignerLink CRUD operations
const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

// Helper: Verify JWT & Admin Role
const verifyAdmin = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return { error: 'Unauthorized: Token missing' };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return { error: 'Forbidden: Admins only' };
        return { decoded };
    } catch (err) {
        return { error: 'Invalid Token' };
    }
};

// --- DESIGNER CRUD --- //
exports.createDesigner = async (req, res) => {
    const { error: authError } = verifyAdmin(req);
    if (authError) return res.status(403).json({ message: authError });

    try {
        const { name, bio, image_url, social_link, role, is_active } = req.body;
        const { data, error } = await supabase
            .from('Designer')
            .insert([{ name, bio, image_url, social_link, role, is_active }])
            .select();

        if (error) return res.status(400).json({ message: 'Error creating designer', error });
        res.status(201).json({ message: 'Designer created', designer: data[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getAllDesigners = async (req, res) => {
    try {
        const { data, error } = await supabase.from('Designer').select('*');
        if (error) return res.status(400).json({ message: 'Error fetching designers', error });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.updateDesigner = async (req, res) => {
    const { error: authError } = verifyAdmin(req);
    if (authError) return res.status(403).json({ message: authError });

    try {
        const { id } = req.params;
        const { name, bio, image_url, social_link, role, is_active } = req.body;

        const { data, error } = await supabase
            .from('Designer')
            .update({ name, bio, image_url, social_link, role, is_active })
            .eq('id', id)
            .select();

        if (error || !data.length) return res.status(400).json({ message: 'Error updating designer', error });
        res.status(200).json({ message: 'Designer updated', designer: data[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.deleteDesigner = async (req, res) => {
    const { error: authError } = verifyAdmin(req);
    if (authError) return res.status(403).json({ message: authError });

    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('Designer')
            .delete()
            .eq('id', id)
            .select();

        if (error || !data.length) return res.status(400).json({ message: 'Error deleting designer', error });
        res.status(200).json({ message: 'Designer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// --- PRODUCT DESIGNER LINK CRUD --- //
exports.createProductDesignerLink = async (req, res) => {
    const { product_id, desinger_id } = req.body;
    try {
        const { data, error } = await supabase
            .from('ProductDesignerLink')
            .insert([{ product_id, desinger_id }])
            .select();

        if (error) return res.status(400).json({ message: 'Error linking product & designer', error });
        res.status(201).json({ message: 'Link created', link: data[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getAllProductDesignerLinks = async (req, res) => {
    try {
        const { data, error } = await supabase.from('ProductDesignerLink').select('*');
        if (error) return res.status(400).json({ message: 'Error fetching links', error });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.deleteProductDesignerLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('ProductDesignerLink')
            .delete()
            .eq('id', id)
            .select();

        if (error || !data.length) return res.status(400).json({ message: 'Error deleting link', error });
        res.status(200).json({ message: 'Link deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
