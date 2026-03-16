import React from "react";

// ok: env-in-client-bundle
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ok: env-in-client-bundle
const analyticsId = process.env.REACT_APP_ANALYTICS_ID;

// ok: env-in-client-bundle
const siteUrl = process.env.VITE_SITE_URL;

// ok: env-in-client-bundle
function Dashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return <div>{apiUrl}</div>;
}
