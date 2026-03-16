// ruleid: no-error-handling-fetch
const response = await fetch("/api/users");

// ruleid: no-error-handling-fetch
fetch("/api/data").then((res) => res.json());

// ruleid: no-error-handling-axios
const result = await axios.get("/api/users");

// ruleid: no-error-handling-axios
axios.post("/api/submit", { name: "test" }).then((res) => res.data);

async function loadData() {
  // ruleid: no-error-handling-fetch
  const res = await fetch("https://api.example.com/data");
  return res.json();
}
