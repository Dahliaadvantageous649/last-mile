// ok: no-error-handling-fetch
try {
  const response = await fetch("/api/users");
  const data = await response.json();
} catch (error) {
  console.error("Failed to fetch users:", error);
}

// ok: no-error-handling-fetch
fetch("/api/data")
  .then((res) => res.json())
  .catch((err) => console.error(err));

// ok: no-error-handling-axios
try {
  const result = await axios.get("/api/users");
} catch (error) {
  handleError(error);
}

// ok: no-error-handling-axios
axios
  .post("/api/submit", { name: "test" })
  .then((res) => res.data)
  .catch((err) => handleError(err));

// ok: no-error-handling-fetch
fetch("/api/data").catch((err) => logger.error(err));
