const supabase = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

// Helper: Verify JWT & Admin Role
const verifyAdmin = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: "Unauthorized: Token missing" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "Admin") return { error: "Forbidden: Admins only" };
    return { decoded };
  } catch (err) {
    return { error: "Invalid Token" };
  }
};

// CREATE Designer — Admin Only
exports.createDesigner = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { name, bio, imageurl, sociallink, role, isactive } = req.body;
    const { data, error } = await supabase
      .from("designer")
      .insert([{ name, bio, imageurl, sociallink, role, isactive }])
      .select();

    if (error)
      return res
        .status(400)
        .json({ message: "Error creating designer", error });
    res.status(201).json({ message: "Designer created", designer: data[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET All Designers — Public
exports.getAllDesigners = async (req, res) => {
  try {
    const { data, error } = await supabase.from("designer").select("*");

    if (error)
      return res
        .status(400)
        .json({ message: "Error fetching designers", error });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE Designer — Admin Only
exports.updateDesigner = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;
    const { name, bio, imageurl, sociallink, role, isactive } = req.body;

    const { data, error } = await supabase
      .from("Designer")
      .update({ name, bio, imageurl, sociallink, role, isactive })
      .eq("designerid", designerid)
      .select();

    if (error || !data.length)
      return res
        .status(400)
        .json({ message: "Error updating designer", error });

    res.status(200).json({ message: "Designer updated", designer: data[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE Designer — Admin Only
exports.deleteDesigner = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("designer")
      .delete()
      .eq("designerid", id)
      .select();

    if (error || !data.length)
      return res
        .status(400)
        .json({ message: "Error deleting designer", error });

    res.status(200).json({ message: "Designer deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
