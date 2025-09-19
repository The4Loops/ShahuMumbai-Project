module.exports = function currentCartOwner(req) {
  if (req.user?.id) return String(req.user.id);
  if(req.guestId) return req.guestId;
  throw new Error("No user or guest id available");
}