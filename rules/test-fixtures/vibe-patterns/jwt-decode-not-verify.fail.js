const jwt = require("jsonwebtoken");

// ruleid: jwt-decode-not-verify
const payload = jwt.decode(token);

// ruleid: jwt-decode-not-verify
const user = jwt.decode(req.headers.authorization, { complete: true });

// ruleid: jwt-decode-not-verify
app.get("/profile", (req, res) => {
  const data = jwt.decode(req.cookies.token);
  res.json(data);
});

// ruleid: jwt-decode-not-verify
function getUserFromToken(token) {
  return jwt.decode(token);
}
