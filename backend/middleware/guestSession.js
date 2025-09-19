const crypto = require ("crypto");
const COOKIE = "sid";

module.exports = function guestSession(req,res,next) {
  if(!req.user) {
    const existing = req.signedCookies?.[COOKIE];
    if(existing) {
      req.guestId = `guest:${existing}`;
    } else {
      const sid = crypto.randomUUID();
      res.cookie(COOKIE, sid, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        path: "/",
      });
      req.guestId = `guest:${sid}`;
    }
  }
  next();
}