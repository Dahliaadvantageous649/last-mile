const express = require("express");

// ruleid: express-no-helmet
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello" });
});

app.listen(3000);
