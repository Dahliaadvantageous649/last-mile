// ok: eval-usage
const data = JSON.parse(jsonString);

// ok: eval-usage
const result = calculateExpression(userInput);

// ok: settimeout-string-arg
setTimeout(() => {
  doSomething();
}, 1000);

// ok: settimeout-string-arg
setInterval(() => {
  updateCounter();
}, 5000);

// ok: eval-usage
const fn = (a, b) => a + b;

// ok: eval-usage
setTimeout(doSomething, 1000);

// ok: eval-usage
setInterval(updateCounter, 5000);
