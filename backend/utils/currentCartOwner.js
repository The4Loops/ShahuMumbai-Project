// backend/utils/currentCartOwner.js
module.exports = function currentCartOwner(req) {
  // Authenticated user (e.g., set by JWT middleware)
  if (req.user?.id != null) return String(req.user.id);

  // Guest user (set by your guestSession middleware)
  if (req.guestId != null) return String(req.guestId);

  const err = new Error('no_cart_owner');
  err.statusCode = 400;
  throw err;
};
