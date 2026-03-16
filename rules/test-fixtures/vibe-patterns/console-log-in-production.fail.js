// ruleid: console-log-in-production
console.log("User logged in:", userId);

// ruleid: console-log-in-production
console.warn("Deprecated API called");

// ruleid: console-log-in-production
console.error("Something went wrong:", error);

// ruleid: console-log-in-production
console.debug("Request payload:", payload);

// ruleid: console-log-in-production
console.info("Server started on port 3000");

function processOrder(order) {
  // ruleid: console-log-in-production
  console.log("Processing order:", order.id);
  return submitOrder(order);
}
