const debug = require('debug')('blockbrain:script:math');

async function math_number(context) {
  context.blockIn();
  return parseFloat(context.getField('NUM'));
}

async function math_arithmetic(context) {
  context.blockIn();
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

async function math_change(context) {
  context.blockIn();
  var varName = context.getField("VAR");
  var delta = await context.getValue("DELTA");

  debug(varName + " += " + delta);

  context.setVar(varName, context.getVar(varName) + delta);
}

async function math_modulo(context) {
  context.blockIn();
  var dividend = parseFloat(await context.getValue("DIVIDEND"));
  var divisor = parseFloat(await context.getValue("DIVISOR"));

  return dividend % divisor;
}

async function math_single(context) {
  context.blockIn();
  var op = parseFloat(context.getField("OP"));
  var num = parseFloat(await context.getValue("NUM"));
  debug("op" + JSON.stringify(op));
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
