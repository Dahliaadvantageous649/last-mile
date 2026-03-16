const express = require("express");

// ruleid: no-rate-limiting
const app = express();

app.get("/api/data", (req, res) => {
  res.json({ data: "hello" });
});

// ruleid: auth-route-no-rate-limit
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  authenticate(email, password);
});

// ruleid: auth-route-no-rate-limit
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  createUser(email, password);
});

// ruleid: auth-route-no-rate-limit
app.post("/api/auth/login", async (req, res) => {
  const user = await login(req.body);
  res.json(user);
});

app.listen(3000);
