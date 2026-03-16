const jwt = require("jsonwebtoken");

// ok: jwt-decode-not-verify
const verified = jwt.verify(token, process.env.JWT_SECRET);

// ok: jwt-decode-not-verify
app.get("/profile", (req, res) => {
  const payload = jwt.verify(req.cookies.token, SECRET_KEY);
  res.json(payload);
});

// ok: jwt-decode-not-verify
function authenticate(token) {
  const valid = jwt.verify(token, secret);
  const details = jwt.decode(token, { complete: true });
  return { valid, details };
}
