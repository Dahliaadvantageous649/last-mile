const cors = require("cors");

// ok: cors-wildcard-origin
app.use(cors({ origin: "https://myapp.com" }));

// ok: cors-wildcard-origin
app.use(
  cors({
    origin: ["https://myapp.com", "https://admin.myapp.com"],
    credentials: true,
  })
);

// ok: cors-wildcard-origin
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// ok: cors-wildcard-origin
res.setHeader("Access-Control-Allow-Origin", "https://myapp.com");
