// ruleid: no-input-validation-body
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  db.createUser(name, email);
  res.json({ success: true });
});

// ruleid: no-input-validation-params
app.get("/users/:id", (req, res) => {
  const user = db.getUser(req.params.id);
  res.json(user);
});

// ruleid: no-input-validation-body
app.put("/settings", async (req, res) => {
  const settings = req.body;
  await saveSettings(settings);
  res.json({ updated: true });
});

// ruleid: no-input-validation-params
app.delete("/posts/:slug", async (req, res) => {
  await db.deletePost(req.params.slug);
  res.status(204).send();
});
