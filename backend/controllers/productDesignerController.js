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

// CREATE ProductDesignerLink — Admin Only
exports.createProductDesignerLink = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { productid, desingerid } = req.body;

    const { data, error } = await supabase
      .from("productdesigner")
      .insert([{ productid, desingerid }])
      .select();

    if (error)
      return res
        .status(400)
        .json({ message: "Error linking product & designer", error });

    res.status(201).json({ message: "Link created", link: data[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET All ProductDesignerLinks — Public
exports.getAllProductDesignerLinks = async (req, res) => {
  try {
    const { data, error } = await supabase.from("productdesigner").select("*");

    if (error)
      return res.status(400).json({ message: "Error fetching links", error });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE ProductDesignerLink — Admin Only
exports.deleteProductDesignerLink = async (req, res) => {
  const { error: authError } = verifyAdmin(req);
  if (authError) return res.status(403).json({ message: authError });

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("productdesigner")
      .delete()
      .eq("productdesignerid", id)
      .select();

    if (error || !data.length)
      return res.status(400).json({ message: "Error deleting link", error });

    res.status(200).json({ message: "Link deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
