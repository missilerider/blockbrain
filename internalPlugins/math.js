async function math_number(context) {
  return parseFloat(context.getField(context, 'NUM'));
}

async function math_arithmetic(context) {
  var op = context.getField(context, "OP");
  var a = await context.getValue(context, "A");
  var b = await context.getValue(context, "B");

  switch(op) {
    case "ADD": return a + b;
    case "MINUS": return a - b;
    case "MULTIPLY": return a * b;
    case "DIVIDE": return a / b;
    case "POWER": return Math.pow(a, b);
  }
  return 0;
}

async function math_change(context) {
  var varName = context.getField(context, "VAR");
  var delta = await context.getValue(context, "DELTA");

  log.d(varName + " += " + delta);

  context.setVar(varName, context.getVar(varName) + delta);
}

module.exports = {
  "math_number": { run: math_number },
  "math_arithmetic": { run: math_arithmetic },
  "math_change": { run: math_change }
}
