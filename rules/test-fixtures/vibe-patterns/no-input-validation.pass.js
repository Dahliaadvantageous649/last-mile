// ok: no-input-validation-body
app.post("/users", (req, res) => {
  const parsed = userSchema.parse(req.body);
  db.createUser(parsed.name, parsed.email);
  res.json({ success: true });
});

// ok: no-input-validation-body
app.put("/settings", (req, res) => {
  const { error, value } = settingsSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  saveSettings(value);
  res.json({ updated: true });
});

// ok: no-input-validation-body
app.post("/orders", (req, res) => {
  const result = validateInput(req.body);
  if (!result.valid) return res.status(400).json(result.errors);
  processOrder(result.data);
  res.json({ success: true });
});
