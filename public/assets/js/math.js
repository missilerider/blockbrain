const sdebug = require('debug')('blockbrain:script:math');

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

  sdebug(varName + " += " + delta);

  context.setVar(context, varName, context.getVar(context, varName) + delta);
}

async function math_modulo(context) {
  var dividend = parseFloat(await context.getValue(context, "DIVIDEND"));
  var divisor = parseFloat(await context.getValue(context, "DIVISOR"));

  return dividend % divisor;
}

async function math_single(context) {
  var op = parseFloat(context.getField(context, "OP"));
  var num = parseFloat(await context.getValue(context, "NUM"));
  debug("op = " + JSON.stringify(op));
  debug("num" + JSON.stringify(num));

  switch(op) {
    case "ROOT": return Math.sqrt(num);
    case "ABS": return Math.abs(num);
    case "NEG": return -1 * num;
    case "LN": return Math.log(num);
    case "LOG10": return Math.log10(num);
    case "EXP": return Math.exp(num);
    case "POW10": return Math.pow(10, num);
  }

  return num;
}

async function getBlocks() {
  return {
    math_number: { run: math_number },
    math_arithmetic: { run: math_arithmetic },
    math_change: { run: math_change },
    math_modulo: { run: math_modulo },
    math_single: { run: math_single }
  }
}

module.exports = {
  getBlocks: getBlocks
}
