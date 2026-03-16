const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();

// ok: no-rate-limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

// ok: auth-route-no-rate-limit
app.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  authenticate(email, password);
});

app.get("/api/data", (req, res) => {
  res.json({ data: "hello" });
});

app.listen(3000);
