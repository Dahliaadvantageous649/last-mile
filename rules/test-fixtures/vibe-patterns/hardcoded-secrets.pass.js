// ok: hardcoded-secrets
const API_KEY = process.env.API_KEY;

// ok: hardcoded-secrets
const password = process.env.DB_PASSWORD;

// ok: hardcoded-secrets
const token = getSecretFromVault("stripe-key");

// ok: hardcoded-secrets
const config = {
  host: "localhost",
  port: 3000,
};

// ok: hardcoded-secrets
const appName = "my-cool-app";

// ok: hardcoded-secrets
const maxRetries = "5";

// ok: hardcoded-secrets
const greeting = "Hello, World!";
