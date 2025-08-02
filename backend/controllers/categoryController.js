const nodemailer = require("nodemailer");
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

// CREATE Category — Admin Only
exports.createCategory = async (req, res) => {
    const { error: authError } = verifyAdmin(req);
    if (authError) return res.status(403).json({ message: authError });

    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name is required' });

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name }])
            .select();

        if (error) return res.status(400).json({ message: 'Error adding category', error });

        res.status(201).json({ message: 'Category created successfully', category: data[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// GET All Categories — Public
exports.getAllCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*');

        if (error) return res.status(400).json({ message: 'Error fetching categories', error });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// UPDATE Category — Admin Only
exports.updateCategory = async (req, res) => {
    const { error: authError } = verifyAdmin(req);
    if (authError) return res.status(403).json({ message: authError });

    try {
        const { id } = req.params;
        const { name } = req.body;

        const { data, error } = await supabase
            .from('categories')
            .update({ name })
            .eq('categoryId', id)
            .select();

        if (error || !data.length) return res.status(400).json({ message: 'Error updating category', error });

        res.status(200).json({ message: 'Category updated successfully', category: data[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// DELETE Category — Admin Only
exports.deleteCategory = async (req, res) => {
    const { error: authError } = verifyAdmin(req);
    if (authError) return res.status(403).json({ message: authError });

    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('categories')
            .delete()
            .eq('categoryId', id)
            .select();

        if (error || !data.length) return res.status(400).json({ message: 'Error deleting category', error });

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};
