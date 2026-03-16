// ruleid: eval-usage
eval("console.log('hello')");

// ruleid: eval-usage
const result = eval(userInput);

// ruleid: eval-usage
const fn = new Function("a", "b", "return a + b");

// ruleid: eval-usage
const dynamicFn = new Function(codeFromUser);

// ruleid: settimeout-string-arg
setTimeout("doSomething()", 1000);

// ruleid: settimeout-string-arg
setInterval("updateCounter()", 5000);

// ruleid: eval-usage
app.post("/calc", (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});
