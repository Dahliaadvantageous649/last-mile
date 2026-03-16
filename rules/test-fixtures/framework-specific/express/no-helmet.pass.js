const express = require("express");
const helmet = require("helmet");

const app = express();

// ok: express-no-helmet
app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello" });
});

app.listen(3000);
