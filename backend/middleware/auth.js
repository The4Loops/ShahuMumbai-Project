const jwt = require("jsonwebtoken");


function optional(req, _res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // e.g., { id, role, ... }
  } catch (_e) {
  }
  next();
}

// Require any logged-in user
function required(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized: token missing" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

// Require Admin role
function admin(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized: token missing" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

module.exports = { optional, required, admin };
