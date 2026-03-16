const cors = require("cors");

// ruleid: cors-wildcard-origin
app.use(cors({ origin: "*" }));

// ruleid: cors-wildcard-origin
app.use(cors({ origin: "*", credentials: true }));

// ruleid: cors-wildcard-origin
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// ruleid: cors-wildcard-origin
app.get("/api/data", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.json({ data: "public" });
});

// ruleid: cors-wildcard-origin
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});
