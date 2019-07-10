async function math_number(context) {
  return parseFloat(context.getField('NUM'));
}

async function math_arithmetic(context) {
  var op = context.getField("OP");
  var a = await context.getValue("A");
  var b = await context.getValue("B");

  switch(op) {
    case "ADD": return a + b;
    case "MINUS": return a - b;
    case "MULTIPLY": return a * b;
    case "DIVIDE": return a / b;
    case "POWER": return Math.pow(a, b);
  }
  return 0;
}

module.exports = {
  "math_number": { run: math_number },
  "math_arithmetic": { run: math_arithmetic }
}
