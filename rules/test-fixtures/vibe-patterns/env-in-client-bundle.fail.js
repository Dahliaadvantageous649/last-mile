import React from "react";

// ruleid: env-in-client-bundle
const API_URL = process.env.API_SECRET_KEY;

// ruleid: env-in-client-bundle
function Dashboard() {
  const dbUrl = process.env.DATABASE_URL;
  return <div>{dbUrl}</div>;
}

// ruleid: env-in-client-bundle
export default function Page() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  return <div>Payment</div>;
}

// ruleid: env-in-client-bundle
const config = {
  apiKey: process.env.INTERNAL_API_KEY,
};
