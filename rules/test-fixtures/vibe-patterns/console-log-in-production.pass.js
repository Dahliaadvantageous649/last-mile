const logger = require("pino")();

// ok: console-log-in-production
logger.info("User logged in", { userId });

// ok: console-log-in-production
logger.warn("Deprecated API called");

// ok: console-log-in-production
logger.error("Something went wrong", { error });

function processOrder(order) {
  // ok: console-log-in-production
  logger.info({ orderId: order.id }, "Processing order");
  return submitOrder(order);
}
